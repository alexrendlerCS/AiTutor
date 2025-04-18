// app/api/subjects/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get("id_by_name")

  if (!name) {
    return NextResponse.json({ error: "Missing subject name" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("subjects")
    .select("id")
    .eq("name", name)
    .single()

  if (error) {
    console.error("Error fetching subject ID:", error)
    return NextResponse.json({ error: "Subject not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}
