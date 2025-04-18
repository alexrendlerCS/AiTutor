// /app/api/progress/update/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { user_id, subject, xp } = await req.json()

  if (!user_id || !subject || xp === undefined) {
    return NextResponse.json({ error: "Missing user_id, subject, or xp" }, { status: 400 })
  }

  // Simple level logic: 100 XP per level
  const level = Math.floor(xp / 100) + 1

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(
      { user_id, subject_id: subject, xp, level },
      { onConflict: "user_id,subject_id" }
    )

  if (error) {
    console.error("Error updating progress:", error)
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
  }

  return NextResponse.json({ success: true, xp, level })
}
