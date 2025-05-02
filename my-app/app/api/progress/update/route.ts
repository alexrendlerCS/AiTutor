import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Calculate required XP for each level
function getRequiredXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.15));
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
    .select("level")
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

  let currentLevel = progress?.level ?? 1;
  let remainingXp = xp;

  // Step 2: Level up based on the XP received (which is total, not delta!)
  while (remainingXp >= getRequiredXpForLevel(currentLevel)) {
    remainingXp -= getRequiredXpForLevel(currentLevel);
    currentLevel += 1;
  }

  // Step 3: Store the XP directly (already includes optimistic addition)
  const { error: updateError } = await supabase.from("user_progress").upsert(
    {
      user_id,
      subject_id: subject,
      xp: remainingXp,
      level: currentLevel,
    },
    { onConflict: "user_id,subject_id" }
  );

  console.log("📝 Final XP write:", {
    user_id,
    subject,
    xp: remainingXp,
    level: currentLevel,
  });

  if (updateError) {
    console.error("Error updating progress:", updateError);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({ xp: remainingXp, level: currentLevel });
}
