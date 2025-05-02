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
    const { subject, message, messages, challenge, challengeId } = body;

    // 🔍 Get user profile (age, grade)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("age, grade, gender")
      .eq("user_id", userId)
      .single();

    // 🔍 Get user progress (level, XP for this subject)
    const { data: progress } = await supabase
      .from("user_progress")
      .select("level, xp")
      .eq("user_id", userId)
      .eq("subject_id", subject)
      .single();

    // ✅ Safe defaults
    const age = profile?.age || "unknown";
    const grade = profile?.grade || "unknown grade";
    const level = progress?.level || 1;
    const xp = progress?.xp ?? 0;
    const isChallenge = challenge === true || !!challengeId;

    // 🧠 Personalized system prompt
    const systemPrompt = `
You are tutoring a student in ${subject}. Here is what you know about them:
- Age: ${age}
- Grade: ${grade}
- Skill level in ${subject}: Level ${level} with ${xp} XP
${
  isChallenge
    ? "- This is a bonus challenge question. Make it feel special and rewarding!"
    : ""
}

Adjust your teaching accordingly:
- Use language appropriate for their age and grade.
- If the level is low, be very gentle, use examples, and explain slowly.
- If the level is high, challenge them more with deeper questions.
- NEVER give direct answers immediately.
Instead, guide them with helpful hints, analogies, or follow-up questions.
Always begin correct feedback with: "Correct!" and praise effort.

Stay encouraging, playful, and concise to match a kid's attention span.
    `.trim();

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
