// app/api/xp/prompts/log/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, subject_id, prompt, success, attempts, used_hint } = body;

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Check for duplicate prompt in last hour
  const { data: recentPrompts, error: fetchError } = await supabase
    .from("user_prompt_attempts")
    .select("id, prompt, timestamp")
    .eq("user_id", user_id)
    .order("timestamp", { ascending: false })
    .limit(20);

  if (fetchError) {
    console.error("❌ Failed to fetch recent prompts:", fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const duplicate = recentPrompts?.find(
    (p) =>
      p.prompt?.trim().toLowerCase() === prompt?.trim().toLowerCase() &&
      new Date(p.timestamp) > oneHourAgo
  );
  if (duplicate) {
    return NextResponse.json({
      success: false,
      message: "Duplicate prompt in the last hour. No XP awarded.",
      xp_earned: 0,
    });
  }

  // 2. Enforce XP cap (10 XP/hour for freeform prompts)
  const recentHourPrompts =
    recentPrompts?.filter((p) => new Date(p.timestamp) > oneHourAgo) || [];
  const xpLastHour = recentHourPrompts.reduce(
    (sum, p) => sum + Number((p as any).xp_earned ?? 0),
    0
  );
  if (xpLastHour >= 10) {
    return NextResponse.json({
      success: false,
      message: "XP cap reached for freeform prompts this hour.",
      xp_earned: 0,
    });
  }

  // 3. Calculate XP
  let xp_earned = 0;
  if (success === true) {
    xp_earned = 2;
    // Cap to not exceed 10 XP/hour
    if (xpLastHour + xp_earned > 10) {
      xp_earned = Math.max(0, 10 - xpLastHour);
    }
  } else {
    xp_earned = 0;
  }

  // 4. Insert prompt attempt
  const { error } = await supabase.from("user_prompt_attempts").insert([
    {
      user_id,
      subject_id,
      prompt,
      success,
      attempts,
      used_hint,
      xp_earned,
      timestamp: now.toISOString(),
    },
  ]);

  if (error) {
    console.error("❌ Failed to insert user_prompt_attempt:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, xp_earned });
}
