// app/api/challenges/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Server‑side only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const subjectIdParam = searchParams.get("subject_id")
  const minDiffParam   = searchParams.get("min_difficulty")
  const maxDiffParam   = searchParams.get("max_difficulty")

  if (!subjectIdParam || !minDiffParam || !maxDiffParam) {
    return NextResponse.json(
      { error: "Missing `subject_id`, `min_difficulty`, or `max_difficulty`" },
      { status: 400 }
    )
  }

  const subject_id     = parseInt(subjectIdParam, 10)
  const min_difficulty = parseInt(minDiffParam, 10)
  const max_difficulty = parseInt(maxDiffParam, 10)

  if ([subject_id, min_difficulty, max_difficulty].some(isNaN)) {
    return NextResponse.json(
      { error: "All parameters must be valid integers" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
      .from("challenges")
      .select("id, prompt, difficulty")
      .match({ subject_id })
      .gte("difficulty", min_difficulty)
      .lte("difficulty", max_difficulty)
      .lte("id", 37) 
      .order("difficulty", { ascending: true });



  if (error) {
    console.error("Fetch challenges error:", error)
    return NextResponse.json(
      { error: error.message || "Could not fetch challenges" },
      { status: 500 }
    )
  }

  return NextResponse.json(data ?? [])
}
