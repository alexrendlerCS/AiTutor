// app/api/challenges/generate/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subject } = body;

  const subjectMap: Record<string, number> = {
    math: 1,
    reading: 2,
    spelling: 3,
    exploration: 4,
  };

  const subjectId = subjectMap[subject?.toLowerCase()];
  if (!subjectId) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }

  const { data: existingChallenge } = await supabase
    .from("active_challenges")
    .select("prompt, difficulty, prompt_type")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  const previousPrompt = existingChallenge?.prompt ?? null;
  const previousDifficulty = existingChallenge?.difficulty ?? 1;
  const previousPromptType = existingChallenge?.prompt_type ?? null;

  const { data: progress } = await supabase
    .from("user_progress")
    .select("level")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  const level = progress?.level ?? 1;

  function detectPromptType(prompt: string, subject: string): string {
    if (subject === "math") {
      if (/missing number|❓/.test(prompt)) return "missing_number";
      if (/real[- ]?life|bus|apples|shopping|story/.test(prompt))
        return "word_problem";
      if (/pattern|sequence/.test(prompt)) return "pattern";
      if (/estimate/i.test(prompt)) return "estimation";
      return "arithmetic";
    }

    if (subject === "reading") {
      if (/main idea/i.test(prompt)) return "main_idea";
      if (/character|happen next|why/i.test(prompt)) return "inference";
      if (/means the same as/i.test(prompt)) return "vocabulary";
      return "reading_comprehension";
    }

    if (subject === "spelling") {
      if (/spell the word/i.test(prompt)) return "fill_in";
      if (/which word is spelled correctly/i.test(prompt))
        return "multiple_choice";
      if (/fix the spelling/i.test(prompt)) return "correction";
      return "spelling_basic";
    }

    if (subject === "exploration") {
      if (/why|what happens/i.test(prompt)) return "curiosity_question";
      if (/name a|identify a/i.test(prompt)) return "fact_question";
      return "exploration_general";
    }

    return "general";
  }

  function getVariationInstructions(subject: string) {
    switch (subject.toLowerCase()) {
      case "math":
        return `
Rotate between different types of math problems:
- Arithmetic (addition, subtraction, multiplication, division)
- Word problems involving real-life scenarios
- Patterns and sequences
- Comparisons (greater/less)
- Estimations
- Missing number (e.g., 3 + ❓ = 10)
Avoid repeating the same structure as the last prompt.
        `;
      case "reading":
        return `
Generate reading comprehension questions like:
- What is the main idea?
- What might happen next?
- Why did the character do that?
- What word means the same as...?
Use short fictional or factual excerpts appropriate for the level.
        `;
      case "spelling":
        return `
Create spelling-based challenges like:
- "Which word is spelled correctly: A) freind, B) friend, C) freand?"
- "Spell the word that means a small dog."
- "Fix the spelling mistake in: 'The boy runned to the store.'"
Keep it fun and level-appropriate.
        `;
      case "exploration":
        return `
Ask open-ended or knowledge-building questions about:
- Nature (e.g., Why do birds migrate?)
- Science (e.g., What happens when water boils?)
- Geography (e.g., Name a place that is always cold)
Use quiz or thought-provoking formats that make them curious.
        `;
      default:
        return "";
    }
  }

  // Check if last_reset is today
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { data: activeChallenge } = await supabase
    .from("active_challenges")
    .select("last_reset")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  let resetToLevel1 = false;
  if (!activeChallenge || activeChallenge.last_reset !== today) {
    resetToLevel1 = true;
  }

  // If reset needed, force previousDifficulty to 0 and previousPromptType to null
  let previousDifficultyToUse = previousDifficulty;
  let previousPromptTypeToUse = previousPromptType;
  if (resetToLevel1) {
    previousDifficultyToUse = 0;
    previousPromptTypeToUse = null;
  }

  const variation =
    getVariationInstructions(subject) +
    (previousPromptTypeToUse
      ? `\nAvoid repeating the same type of question as last time, which was "${previousPromptTypeToUse}".`
      : "");

  const systemPrompt = `
You are an intelligent tutor generating personalized challenge questions for a ${subject} student.

### Student Info
- Level: ${level}
- Subject: ${subject}
${
  previousPrompt
    ? `- Previous Challenge: "${previousPrompt}"`
    : "- This is the student's first challenge."
}
${previousPromptTypeToUse ? `- Previous Type: ${previousPromptTypeToUse}` : ""}

### Task
Create a new challenge question that builds on the student's progress and is slightly more difficult.

### Rules
1. Increase difficulty by:
   - Adding one more step
   - Using slightly larger numbers or deeper reasoning
2. Make it short, clear, and grade-appropriate for level ${level}
3. Do NOT include the answer or explanations.
4. Return only a single question — nothing more.

${variation}

Now generate the next challenge:
`.trim();

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [{ role: "system", content: systemPrompt }],
    }),
  });

  const aiData = await aiRes.json();
  const newPrompt = aiData?.choices?.[0]?.message?.content?.trim();

  if (!newPrompt) {
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }

  const promptType = detectPromptType(newPrompt, subject);

  // Clamp difficulty to allowed range (1–5)
  const allowedMin = 1;
  const allowedMax = 5;
  const nextDifficulty = Math.max(
    allowedMin,
    Math.min(previousDifficultyToUse + 1, allowedMax)
  );

  // 1️⃣ Insert into 'challenges' table first
  const { data: insertedChallenge, error: insertError } = await supabase
    .from("challenges")
    .insert({
      subject_id: subjectId,
      prompt: newPrompt,
      difficulty: resetToLevel1 ? 1 : nextDifficulty,
      prompt_type: promptType,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !insertedChallenge) {
    console.error("❌ Error inserting challenge:", insertError);
    console.error("Full error details:", {
      error: insertError,
      subjectId,
      prompt: newPrompt,
      difficulty: resetToLevel1 ? 1 : nextDifficulty,
      promptType,
    });
    return NextResponse.json(
      { error: "Challenge insert failed" },
      { status: 500 }
    );
  }

  // 2️⃣ Upsert into 'active_challenges', update last_reset, and store challenge_id
  const { error: upsertError } = await supabase
    .from("active_challenges")
    .upsert(
      {
        user_id: user.id,
        subject_id: subjectId,
        prompt: newPrompt,
        difficulty: resetToLevel1 ? 1 : insertedChallenge.difficulty,
        prompt_type: promptType,
        updated_at: new Date().toISOString(),
        last_reset: today,
        challenge_id: insertedChallenge.id,
      },
      { onConflict: "user_id,subject_id" }
    );

  if (upsertError) {
    console.error("❌ Error upserting active challenge:", upsertError);
    return NextResponse.json(
      { error: "Active challenge update failed" },
      { status: 500 }
    );
  }

  console.log(`✅ Generated challenge for user ${user.id}:`, newPrompt);

  // Check if any subject's last_reset is not today
  const { data: allActiveChallenges } = await supabase
    .from("active_challenges")
    .select("subject_id, last_reset")
    .eq("user_id", user.id);

  let globalResetToLevel1 = false;
  if (allActiveChallenges) {
    for (const ch of allActiveChallenges) {
      if (ch.last_reset !== today) {
        globalResetToLevel1 = true;
        break;
      }
    }
  } else {
    globalResetToLevel1 = true;
  }

  // If any subject needs reset, reset all subjects for this user
  if (globalResetToLevel1) {
    // Update all active_challenges for this user to level 1 and last_reset = today
    await supabase
      .from("active_challenges")
      .update({
        difficulty: 1,
        last_reset: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    previousDifficultyToUse = 0;
    previousPromptTypeToUse = null;
  }

  return NextResponse.json({
    challenge: {
      prompt: newPrompt,
      difficulty: resetToLevel1 ? 1 : insertedChallenge.difficulty,
      challenge_id: insertedChallenge.id,
    },
  });
}
