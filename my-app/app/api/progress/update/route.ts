// my-app/app/api/progress/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// XP needed for a given level
function getRequiredXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.15));
}

// Get level from total XP (without subtracting it)
function getLevelFromXp(totalXp: number): number {
  let level = 1;
  let xpToNext = getRequiredXpForLevel(level);

  while (totalXp >= xpToNext) {
    totalXp -= xpToNext;
    level += 1;
    xpToNext = getRequiredXpForLevel(level);
  }

  return level;
}

export async function POST(req: NextRequest) {
  const { user_id, subject, xp } = await req.json();

  if (!user_id || !subject || xp === undefined) {
    return NextResponse.json(
      { error: "Missing user_id, subject, or xp" },
      { status: 400 }
    );
  }

  // Compute level directly from total XP
  const newLevel = getLevelFromXp(xp);

  // Store total XP and computed level
  const { error: updateError } = await supabase.from("user_progress").upsert(
    {
      user_id,
      subject_id: subject,
      xp, // ✅ Store full XP (not subtracted)
      level: newLevel,
    },
    { onConflict: "user_id,subject_id" }
  );

  console.log("📝 Final XP write:", {
    user_id,
    subject,
    xp,
    level: newLevel,
  });

  if (updateError) {
    console.error("Error updating progress:", updateError);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({ xp, level: newLevel });
}
