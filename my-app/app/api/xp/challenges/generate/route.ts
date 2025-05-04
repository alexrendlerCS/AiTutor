// app/api/challenges/generate/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const cookieStore = cookies(); // ✅ Get cookies
  const supabase = createServerComponentClient({ cookies: () => cookieStore }); // ✅ Wrap in function

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

  const subjectId = subjectMap[subject?.toLowerCase()];
  if (!subjectId) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }
  
  // 🎯 Fetch prior challenge for context (but don’t block generation)
  const { data: existingChallenge } = await supabase
    .from("active_challenges")
    .select("prompt, difficulty, prompt_type") 
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  const previousPrompt = existingChallenge?.prompt ?? null;
  const previousDifficulty = existingChallenge?.difficulty ?? 1;
  const previousPromptType = existingChallenge?.prompt_type ?? null;


  // 🧠 Get user level for difficulty context
  const { data: progress } = await supabase
    .from("user_progress")
    .select("level")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  const level = progress?.level ?? 1;

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

  const variation =
    getVariationInstructions(subject) +
    (previousPromptType
      ? `\nAvoid repeating the same type of question as last time, which was "${previousPromptType}".`
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
${previousPromptType ? `- Previous Type: ${previousPromptType}` : ""}

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

  const promptType = detectPromptType(newPrompt, subject);

  if (!newPrompt) {
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
  
  const { data: inserted, error: upsertError } = await supabase
    .from("active_challenges")
    .upsert(
      {
        user_id: user.id,
        subject_id: subjectId,
        prompt: newPrompt,
        difficulty: previousDifficulty + 1,
        prompt_type: promptType,
      },
      { onConflict: "user_id,subject_id" }
    )
    .select()
    .single();
  console.log(
    `✅ Generated ${subject} challenge for user ${user.id}:`,
    newPrompt
  );
  if (upsertError) {
    console.error("❌ Error storing challenge:", upsertError);
    return NextResponse.json(
      { error: "Failed to store challenge" },
      { status: 500 }
    );
  }

  return NextResponse.json({ challenge: inserted });
}
