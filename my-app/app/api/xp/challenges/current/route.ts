import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subject } = body;

  const subjectMap: Record<string, number> = {
    math: 1,
    reading: 2,
    spelling: 3,
    exploration: 4,
  };

  const subjectId = subjectMap[subject?.toLowerCase()];
  if (!subjectId) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }

  // Join active_challenges with challenges to get the correct challenge_id and difficulty
  const { data, error } = await supabase
    .from("active_challenges")
    .select(
      `challenge_id, prompt, difficulty, prompt_type, updated_at, last_reset`
    )
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  if (error) {
    return NextResponse.json({ challenge: null }, { status: 200 });
  }

  // If challenge_id is present, fetch the challenge for full details
  let challenge = data;
  if (data?.challenge_id) {
    const { data: challengeRow, error: challengeError } = await supabase
      .from("challenges")
      .select("id, prompt, difficulty, prompt_type")
      .eq("id", data.challenge_id)
      .single();
    if (!challengeError && challengeRow) {
      challenge = {
        ...challengeRow,
        challenge_id: challengeRow.id,
        updated_at: data.updated_at,
        last_reset: data.last_reset,
      };
    }
  }

  return NextResponse.json({ challenge });
}
