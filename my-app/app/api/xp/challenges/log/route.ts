// app/api/xp/challenges/log/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const {
    user_id,
    challenge_id,
    success,
    attempts,
    xp_earned,
  } = await req.json()

  // Basic validation: all these fields are required
  if (
    !user_id ||
    challenge_id === undefined ||
    success === undefined ||
    attempts === undefined ||
    xp_earned === undefined
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  // Insert into user_challenge_attempts
  const { error } = await supabase
    .from("user_challenge_attempts")
    .insert({
      user_id,
      challenge_id,
      success,
      attempts,
      xp_earned,
      // attempt_time is assumed to default to now() in your schema
    })

  if (error) {
    console.error("Error logging challenge:", error)
    return NextResponse.json(
      { error: error.message || "Failed to log challenge" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
