// app/api/xp/challenges/log/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, challenge_id, success, attempts, used_hint, xp_earned } =
    body;

  const cookieStore = cookies(); // ✅ Correct way for route handlers
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });


  try {
    // 🧠 Fetch subject_id for XP logic
    const { data: challengeInfo, error: fetchError } = await supabase
      .from("active_challenges")
      .select("subject_id, prompt_type") 
      .eq("id", challenge_id)
      .single();

    if (fetchError || !challengeInfo) {
      console.error(
        "❌ Failed to fetch challenge subject:",
        fetchError?.message
      );
      return NextResponse.json(
        { error: "Could not get challenge subject" },
        { status: 500 }
      );
    }

    const { subject_id, prompt_type } = challengeInfo;

    // 🔍 Attempt upsert — safely handle unique constraint
    const { error: upsertError } = await supabase
      .from("user_challenge_attempts")
      .upsert(
        [
          {
            user_id,
            challenge_id,
            success,
            attempts,
            used_hint,
            xp_earned,
            prompt_type,
            subject_id, 
          },
        ],
        { onConflict: "user_id,challenge_id" }
      );


    if (upsertError) {
      if (upsertError.code === "23505") {
        console.log("⚠️ Duplicate challenge attempt — skipping XP.");
        return NextResponse.json(
          { message: "Already logged" },
          { status: 200 }
        );
      }
      console.error("❌ Upsert error:", upsertError.message);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // 🎯 Only increment XP if the current attempt was successful
    if (success) {
      const { error: updateError } = await supabase.rpc("increment_user_xp", {
        xp_to_add: xp_earned,
        user_id_param: user_id,
        subject_id_param: subject_id,
      });

      if (updateError) {
        console.error("❌ Failed to update XP:", updateError.message);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      console.log("✅ XP updated via RPC for successful challenge.");
    }

    console.log("✅ Challenge logged:", { user_id, challenge_id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
