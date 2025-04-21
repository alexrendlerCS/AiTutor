// app/api/xp/challenges/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const { user_id, challenge_id } = await req.json();

  if (!user_id || !challenge_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // ✅ FIXED: Wrap `cookies()` in a function as required
  const supabase = createServerComponentClient({
    cookies: () => cookies(),
  });

  const { data, error } = await supabase
    .from("user_challenge_attempts")
    .select("id")
    .eq("user_id", user_id)
    .eq("challenge_id", challenge_id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alreadyAnswered: !!data });
}
