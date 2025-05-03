import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, challenge_id, success, attempts, used_hint, xp_earned } =
    body;

  const supabase = createRouteHandlerClient({ cookies });

  // 🔍 Check if already logged
  const { data: existing, error: fetchAttemptError } = await supabase
    .from("user_challenge_attempts")
    .select("id")
    .eq("user_id", user_id)
    .eq("challenge_id", challenge_id)
    .maybeSingle();

  if (existing) {
    console.log("⚠️ Challenge already logged. Skipping insert.");
    return NextResponse.json({ message: "Already logged" }, { status: 200 });
  }

  // ✅ Insert challenge attempt
  const { error: insertError } = await supabase
    .from("user_challenge_attempts")
    .insert([
      {
        user_id,
        challenge_id,
        success,
        attempts,
        used_hint,
        xp_earned,
      },
    ]);

  if (insertError) {
    console.error("❌ Failed to log challenge:", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 🧠 Fetch subject_id for XP increment
  const { data: challengeInfo, error: fetchError } = await supabase
    .from("challenges")
    .select("subject_id")
    .eq("id", challenge_id)
    .single();

  if (fetchError || !challengeInfo) {
    console.error(
      "❌ Failed to fetch challenge's subject_id:",
      fetchError?.message
    );
    return NextResponse.json(
      { error: "Could not get challenge subject" },
      { status: 500 }
    );
  }

  const subject_id = challengeInfo.subject_id;

  // 🎯 Increment XP
  const { error: updateError } = await supabase.rpc("increment_user_xp", {
    xp_to_add: xp_earned,
    user_id_param: user_id,
    subject_id_param: subject_id,
  });

  if (updateError) {
    console.error("❌ Failed to update XP:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log("✅ Challenge logged and XP updated:", { user_id, challenge_id });
  return NextResponse.json({ success: true });
}
