// app/api/profile/status/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies: () => cookies() });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("🔒 Auth error:", authError?.message || "No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("completed_intro_quiz")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.warn("⚠️ Profile not found or error:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      completed_intro_quiz: profile.completed_intro_quiz,
    });
  } catch (err: any) {
    console.error(
      "🔥 Unexpected error in profile status route:",
      err.message || err
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
