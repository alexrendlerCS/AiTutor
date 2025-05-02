// /app/api/progress/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to calculate XP needed for a specific level
function getRequiredXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.15)); // XP grows with level
}

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
    console.error("Error fetching progress:", fetchError);
    return NextResponse.json(
      { error: "Could not fetch current progress" },
      { status: 500 }
    );
  }

  let currentXP = progress?.xp ?? 0;
  let currentLevel = progress?.level ?? 1;

  // Step 2: Add XP and level up accordingly
  let totalXP = currentXP + xp;

  while (totalXP >= getRequiredXpForLevel(currentLevel)) {
    totalXP -= getRequiredXpForLevel(currentLevel);
    currentLevel += 1;
  }

  // Step 3: Update or insert progress
  const { error: updateError } = await supabase.from("user_progress").upsert(
    {
      user_id,
      subject_id: subject,
      xp: totalXP,
      level: currentLevel,
    },
    { onConflict: "user_id,subject_id" }
  );

  console.log("📝 Final XP write:", {
    user_id,
    subject,
    xp: totalXP,
    level: currentLevel,
  });

  if (updateError) {
    console.error("Error updating progress:", updateError);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({ xp: totalXP, level: currentLevel });
}
