// /app/api/xp/challenges/log/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, subject, correct, attempts, used_hint, xp_earned } = body

  if (!user_id || !subject || attempts === undefined || xp_earned === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const subjectMap: Record<string, number> = {
    math: 1,
    reading: 2,
    spelling: 3,
    exploration: 4,
  }

  const subject_id = subjectMap[subject.toLowerCase()]
  if (!subject_id) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 })
  }

  const { error } = await supabase.from("user_challenge_attempts").insert({
    user_id,
    subject_id,
    correct,
    attempts,
    used_hint,
    xp_earned,
  })

  if (error) {
    console.error("Error logging challenge:", error)
    return NextResponse.json({ error: "Failed to log challenge" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
