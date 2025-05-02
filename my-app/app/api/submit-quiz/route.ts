// app/api/submit-quiz/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    console.log("🟢 Starting route logic");

    const supabase = createServerComponentClient({ cookies: () => cookies() });
    console.log("✅ Supabase server client initialized");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("🔒 Auth error or user missing:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    console.log("👤 Authenticated user ID:", userId);

    const body = await req.json();
    console.log("📦 Received body:", body);

    const { mathScore, readingScore } = body;

    const determineLevel = (score: number) => {
      if (score >= 80) return 5;
      if (score >= 60) return 4;
      if (score >= 40) return 3;
      if (score >= 20) return 2;
      return 1;
    };

    const mathLevel = determineLevel(mathScore);
    const readingLevel = determineLevel(readingScore);
    console.log("📊 Levels calculated:", { mathLevel, readingLevel });

    // 1. Update user_profiles with starting levels
    const { error: profileUpdateError } = await supabase
      .from("user_profiles")
      .update({
        starting_math_level: mathLevel,
        starting_reading_level: readingLevel,
        started_intro_quiz: true,
        completed_intro_quiz: true,
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.log("💥 user_profiles error:", profileUpdateError);
      return NextResponse.json(
        { error: profileUpdateError.message },
        { status: 500 }
      );
    }

    // 2. Upsert progress rows per subject
    const { error: progressError } = await supabase
      .from("user_progress")
      .upsert(
        [
          { user_id: userId, subject_id: 1, level: mathLevel, xp: 0 },
          { user_id: userId, subject_id: 2, level: readingLevel, xp: 0 },
        ],
        { onConflict: "user_id,subject_id" }
      );

    if (progressError) {
      console.log("💥 user_progress error:", progressError);
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    console.log("✅ Intro quiz completed");
    return NextResponse.json({ message: "Intro quiz submitted successfully" });
  } catch (error: any) {
    console.error("🔥 Route crashed:", error.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
