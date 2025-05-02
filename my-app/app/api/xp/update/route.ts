import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calculateLevel(xp: number): number {
  return Math.floor((-1 + Math.sqrt(1 + (8 * xp) / 100)) / 2);
}

export async function POST(req: NextRequest) {
  const {
    userId: bodyUserId,
    subject,
    xpGained,
    source = "standard",
  } = await req.json();

  if (!subject || typeof xpGained !== "number") {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Fallback to auth-based user ID if not provided
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const userId = bodyUserId || user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "User ID missing or unauthorized" },
      { status: 401 }
    );
  }

  // Get subject ID
  const { data: subjectData, error: subjectError } = await supabase
    .from("subjects")
    .select("id")
    .eq("name", subject)
    .single();

  if (subjectError || !subjectData) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }

  const subjectId = subjectData.id;

  // Get existing progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("xp")
    .match({ user_id: userId, subject_id: subjectId })
    .single();

  let newXP = xpGained;
  if (progress) newXP += progress.xp;

  const newLevel = calculateLevel(newXP);

  const { error: upsertError } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      subject_id: subjectId,
      xp: newXP,
      level: newLevel,
      last_updated: new Date().toISOString(),
    },
    { onConflict: "user_id,subject_id" }
  );

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `XP updated from ${source}`,
    xp: newXP,
    level: newLevel,
  });
}
