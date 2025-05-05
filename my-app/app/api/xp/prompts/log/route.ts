// app/api/xp/prompts/log/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    user_id,
    subject_id,
    prompt,
    success,
    attempts,
    used_hint,
    xp_earned,
  } = body;

  const cookieStore = cookies(); 
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { error } = await supabase.from("user_prompt_attempts").insert([
      {
        user_id,
        subject_id,
        prompt,
        success,
        attempts,
        used_hint,
        xp_earned,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("❌ Failed to insert user_prompt_attempt:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
