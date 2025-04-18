import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { user_id, subject, correct, attempts, used_hint, xp_earned } = await req.json()

  if (!user_id || !subject || attempts === undefined || xp_earned === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { error } = await supabase.from("user_challenge_attempts").insert([
    {
      user_id,
      subject,
      correct,
      attempts,
      used_hint,
      xp_earned,
    },
  ])

  if (error) {
    console.error("Error logging challenge attempt:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Challenge attempt logged successfully" }, { status: 200 })
}
