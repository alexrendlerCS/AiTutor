// /app/api/progress/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { user_id, subject, xp } = await req.json();

  if (!user_id || !subject || xp === undefined) {
    return NextResponse.json(
      { error: "Missing user_id, subject, or xp" },
      { status: 400 }
    );
  }

  // Step 1: Fetch current progress
  const { data: progress, error: fetchError } = await supabase
    .from("user_progress")
    .select("xp, level")
    .eq("user_id", user_id)
    .eq("subject_id", subject)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // Ignore 'row not found' error, which is fine for first time
    console.error("Error fetching progress:", fetchError);
    return NextResponse.json(
      { error: "Could not fetch current progress" },
      { status: 500 }
    );
  }

  const currentXP = progress?.xp ?? 0;
  const currentLevel = progress?.level ?? 1;

  // Step 2: Add XP and calculate new level
  const totalXP = xp; // Use XP from client directly
  const levelUps = Math.floor(totalXP / 100);
  const newXP = totalXP % 100;
  const newLevel = currentLevel + levelUps;

  // Step 3: Update or insert progress
  const { error: updateError } = await supabase.from("user_progress").upsert(
    {
      user_id,
      subject_id: subject,
      xp: newXP,
      level: newLevel,
    },
    { onConflict: "user_id,subject_id" } // Use correct conflict target
  );
  console.log("📝 Final XP write:", { user_id, subject, newXP, newLevel });
  if (updateError) {
    console.error("Error updating progress:", updateError);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({ xp: newXP, level: newLevel });
}
