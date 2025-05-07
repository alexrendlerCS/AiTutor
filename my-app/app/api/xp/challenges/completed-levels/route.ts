import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const subject = searchParams.get("subject");

  if (!user_id || !subject) {
    return NextResponse.json(
      { error: "Missing user_id or subject" },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const subjectMap: Record<string, number> = {
    math: 1,
    reading: 2,
    spelling: 3,
    exploration: 4,
  };

  const subjectId = subjectMap[subject.toLowerCase()];
  if (!subjectId) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }

  try {
    // Get all successful challenge attempts for this subject
    const { data: completedChallenges, error } = await supabase
      .from("user_challenge_attempts")
      .select("challenge_id, success")
      .eq("user_id", user_id)
      .eq("subject_id", subjectId)
      .eq("success", true);

    if (error) {
      console.error("❌ Error fetching completed challenges:", error);
      return NextResponse.json(
        { error: "Failed to fetch completed challenges" },
        { status: 500 }
      );
    }

    // Get the difficulty levels for these challenges
    const challengeIds = completedChallenges.map((c) => c.challenge_id);
    const { data: challengeDetails, error: detailsError } = await supabase
      .from("challenges")
      .select("id, difficulty")
      .in("id", challengeIds);

    if (detailsError) {
      console.error("❌ Error fetching challenge details:", detailsError);
      return NextResponse.json(
        { error: "Failed to fetch challenge details" },
        { status: 500 }
      );
    }

    // Get unique completed levels (1-5)
    const completedLevels = [
      ...new Set(challengeDetails.map((c) => c.difficulty)),
    ].sort();

    return NextResponse.json({ completedLevels });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
