// app/api/profile/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookies() });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("🔒 Auth error:", authError?.message || "No user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { age, grade, gender } = await req.json();
    console.log("📥 Profile payload:", { age, grade, gender });

    if (!age || !grade) {
      return NextResponse.json(
        { error: "Age and grade are required" },
        { status: 400 }
      );
    }

    const { error: upsertError } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      age,
      grade,
      gender,
      started_intro_quiz: true,
    });

    if (upsertError) {
      console.error("🔥 Upsert error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error: any) {
    console.error("🔥 Unexpected error:", error.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
