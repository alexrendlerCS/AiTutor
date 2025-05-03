// app/api/challenges/generate/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });

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

  // 🎯 Fetch prior challenge for context (but don’t block generation)
  const { data: existingChallenge } = await supabase
    .from("active_challenges")
    .select("*")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  const previousPrompt = existingChallenge?.prompt ?? null;
  const previousDifficulty = existingChallenge?.difficulty ?? 1;

  // 🧠 Get user level for difficulty context
  const { data: progress } = await supabase
    .from("user_progress")
    .select("level")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  const level = progress?.level ?? 1;

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

### Task
Create a new challenge question that builds on the student's progress and is slightly more difficult.

### Rules
1. Increase difficulty by:
   - Adding one more step
   - Using slightly larger numbers or deeper reasoning
2. Make it short, clear, and grade-appropriate for level ${level}
3. Do NOT include the answer or explanations.
4. Return only a single question — nothing more.

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

  const { data: inserted, error: upsertError } = await supabase
    .from("active_challenges")
    .upsert(
      {
        user_id: user.id,
        subject_id: subjectId,
        prompt: newPrompt,
        difficulty: previousDifficulty + 1,
      },
      { onConflict: "user_id,subject_id" }
    )
    .select()
    .single();

  if (upsertError) {
    console.error("❌ Error storing challenge:", upsertError);
    return NextResponse.json(
      { error: "Failed to store challenge" },
      { status: 500 }
    );
  }

  return NextResponse.json({ challenge: inserted });
}
