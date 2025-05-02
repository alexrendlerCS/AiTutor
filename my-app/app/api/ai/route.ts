// app/api/ai/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ reply: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json();
    const { subject, message, messages, challenge, challengeId, attempts } =
      body;

    // 🔁 Map subject names to IDs
    const subjectMap: Record<string, number> = {
      math: 1,
      reading: 2,
    };
    const subjectId = subjectMap[subject.toLowerCase()] ?? -1;

    // 🔍 Fetch user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("age, grade, gender")
      .eq("user_id", userId)
      .single();

    // 🔍 Fetch user progress for this subject
    const { data: progress } = await supabase
      .from("user_progress")
      .select("level, xp")
      .eq("user_id", userId)
      .eq("subject_id", subjectId)
      .single();

    const age = profile?.age || "unknown";
    const grade = profile?.grade || "unknown grade";
    const level = progress?.level || 1;
    const xp = progress?.xp ?? 0;
    const isChallenge = challenge === true || !!challengeId;

    // 🧠 Define answer-reveal behavior based on attempt count
    let guidanceBehavior = "";

    if (attempts === 0) {
      guidanceBehavior = `
      The student is on their first attempt. 
      NEVER reveal the final answer. 
      Do NOT explain the full process.
      Instead, respond with a guiding question, helpful analogy, or clue that prompts the student to think independently.
      Examples: 
      - "What do you think happens when you add 5 four times?"
      - "Can you imagine 4 groups of 5 apples?"
      `;
    } else if (attempts === 1) {
      guidanceBehavior = `
      The student tried once. 
      Still do NOT reveal the answer or the full explanation.
      Instead, offer a hint, suggest a first step, or ask a guiding question to build confidence.
      Examples:
      - "You're on the right track! Try drawing it out."
      - "What’s 5 plus 5? Now what if you add 5 again?"
      `;
    } else if (attempts === 2) {
      guidanceBehavior = `
      They’ve made two attempts. 
      You may now offer a more detailed breakdown, but still do NOT give the final answer.
      Help them understand the *process* clearly.
      Encourage one step at a time.
      `;
    } else {
      guidanceBehavior = `
      They’ve tried three or more times.
      Now you may explain the full solution step-by-step — but begin by checking what they already understand.
      Encourage reflection: “What part of this was tricky?”
      Then walk them through the reasoning gently.
      `;
    }

    const systemPrompt = `
      [Profile]
      - Subject: ${subject}
      - Age: ${age}
      - Grade: ${grade}
      - Skill Level: ${level}
      - XP: ${xp}
      ${isChallenge ? "- Challenge mode enabled" : ""}
      - Attempts on current problem: ${attempts ?? 0}

      You are a private tutor teaching a ${subject} student.

      ${guidanceBehavior}

      You must adapt your teaching style based on the student's level:
      - Levels 1–2: Use simple, playful language and visual metaphors (e.g., apples, toys, animals).
        Break concepts into tiny, digestible steps with repetition if needed.
        Use basic math words like “more,” “take away,” “same as,” instead of formal terms.
        Ask yes/no or fill-in-the-blank questions to build confidence.
        Always encourage and reassure after every response.
      - Levels 3–5: Use grade-appropriate vocabulary such as "multiply," "divide," and "simplify."
        Avoid childish metaphors — instead, explain using real math operations.
        Introduce the idea of solving by steps (e.g., “divide both sides by 4”).
        Let the student reason through part of the answer and offer correction gently.
        Use short prompts like “What’s the next step you’d take here?”
      - Levels 6–8: Present real-world scenarios (e.g., shopping, travel, time) with practical relevance.
        Use multi-step logic problems that require a plan, not just direct calculation.
        Ask leading questions like “Why do you think that step is important?”
        Encourage mental math, estimation, or trying alternate paths.
        Treat the student like a problem-solver who may need nudges, not answers.
      - Levels 9–12: Assume the student can reason abstractly and algebraically.
        Use math vocabulary confidently: “distribute,” “factor,” “substitute,” “evaluate.”
        Avoid metaphors. Prioritize strategic thinking and efficiency.
        Challenge them to explain why steps work or explore alternate methods.
        Provide prompts that sound like: “Prove,” “Justify,” “Compare,” or “Derive.”
        
      ### Rules for Answering Student Questions
      You must follow these strict tutoring rules when responding:

      1. If the student has made fewer than 3 attempts:
        - NEVER reveal the final answer.
        - NEVER state the full equation with the result (e.g., "4 x 4 = 16" is NOT allowed).
        - If you're about to give the final number, replace it with a ❓ or leave it blank.
        - End with a guiding question to let the student solve the last step.
        - Example: Instead of "4 + 4 + 4 + 4 = 16", say "4 + 4 + 4 + 4 = ❓" and ask "What does that equal?"

      2. Only after 3 or more failed attempts:
        - You may walk through the full solution clearly and with encouragement.
        - Begin your response by asking the student what they found confusing.
        - Use "Correct!" only once you're sure they understand the full explanation.

      You are teaching students to think, not to watch. Avoid doing the full thinking for them.
      Never give answers directly unless the student has failed multiple times. 
      Begin all correct responses with "Correct!" and reinforce learning with brief, clear feedback.
      `.trim();

    console.log("🧠 Final System Prompt:", systemPrompt);

    const chatMessages = Array.isArray(messages)
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: chatMessages,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("OpenAI API error:", err);
      return NextResponse.json({
        reply: "Hmm... I'm having trouble responding right now.",
      });
    }

    const data = await res.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({
      reply: "Something went wrong on the server.",
    });
  }
}
