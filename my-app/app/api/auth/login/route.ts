import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,  
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key" // Use env var in production

export async function POST(req: NextRequest) {
  const { login, password } = await req.json()

  if (!login || !password) {
    return NextResponse.json({ error: "Login and password required" }, { status: 400 })
  }

  // Determine if login is email or username
  let query = supabase.from("users").select("*").limit(1)

  if (login.includes("@")) {
    query = query.eq("email", login)
  } else {
    query = query.eq("username", login)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const isValid = await bcrypt.compare(password, data.password_hash)
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = jwt.sign(
    {
      userId: data.id,
      username: data.username,
      email: data.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  return NextResponse.json({
    token,
    userId: data.id,
    username: data.username,
    email: data.email,
  })
}
