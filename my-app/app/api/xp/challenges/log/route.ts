import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const {
    user_id,
    challenge_id,
    success,
    attempts,
    xp_earned,
    used_hint = false, // optional field, default to false
  } = await req.json();

  // ✅ Basic validation
  if (
    !user_id ||
    challenge_id === undefined ||
    success === undefined ||
    attempts === undefined ||
    xp_earned === undefined
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // ✅ Check for existing attempt (to avoid UNIQUE constraint violation)
  const { data: existing, error: checkError } = await supabase
    .from("user_challenge_attempts")
    .select("id")
    .eq("user_id", user_id)
    .eq("challenge_id", challenge_id)
    .maybeSingle();

  if (checkError) {
    console.error("❌ Error checking existing attempt:", checkError);
    return NextResponse.json(
      { error: "Error checking existing attempt" },
      { status: 500 }
    );
  }

  if (existing) {
    console.log("⚠️ Duplicate challenge attempt skipped.");
    return NextResponse.json({ alreadyExists: true }, { status: 200 });
  }

  // ✅ Insert new challenge attempt
  const { error: insertError } = await supabase
    .from("user_challenge_attempts")
    .insert({
      user_id,
      challenge_id,
      success,
      attempts,
      xp_earned,
    });

  if (insertError) {
    console.error("❌ Error inserting challenge attempt:", insertError);
    return NextResponse.json(
      { error: "Failed to insert challenge attempt" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
