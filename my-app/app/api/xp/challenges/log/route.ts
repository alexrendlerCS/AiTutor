// my-app/app/api/xp/challenges/log/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, challenge_id, success, attempts, used_hint, xp_earned } =
    body;

  const supabase = createRouteHandlerClient({ cookies });

  // 1. Insert challenge attempt
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

  // ✅ 2. Fetch subject_id from challenge
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

  const { error: updateError } = await supabase.rpc("increment_user_xp", {
    xp_to_add: xp_earned,
    user_id_param: user_id,
    subject_id_param: subject_id,
  });

  console.log("✅ XP increment RPC triggered for:", {
    user_id,
    subject_id,
    xp_earned,
  });

  if (updateError) {
    console.error("❌ Failed to update XP:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  
  console.log(
    "✅ Full challenge log + XP update complete for challenge:",
    challenge_id
  );

  return NextResponse.json({ success: true });
}
