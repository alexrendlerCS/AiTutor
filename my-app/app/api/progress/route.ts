// AITutor/my-app/app/api/progress/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get("user_id")
  const subject = searchParams.get("subject")

  if (!user_id || !subject) {
    return NextResponse.json({ error: "Missing user_id or subject" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("user_progress")
    .select("xp, level")
    .eq("user_id", user_id)
    .eq("subject_id", subject)
    .limit(1)

  if (error) {
    console.error("Error fetching user progress:", error)
    return NextResponse.json({ xp: 0, level: 1 }) // fallback
  }

  // If no row found, insert one for first-time progress tracking
  if (!data || data.length === 0) {
    const insertRes = await supabase.from("user_progress").insert({
      user_id,
      subject_id: subject,
      xp: 0,
      level: 1,
    })

    if (insertRes.error) {
      console.error("Error inserting default progress:", insertRes.error)
    }

    return NextResponse.json({ xp: 0, level: 1 })
  }

  // Return existing progress
  return NextResponse.json(data[0])
}
