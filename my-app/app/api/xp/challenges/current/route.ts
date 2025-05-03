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

  const { data: challenge, error } = await supabase
    .from("active_challenges")
    .select("*")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single();

  if (error) {
    return NextResponse.json({ challenge: null }, { status: 200 });
  }

  return NextResponse.json({ challenge });
}
