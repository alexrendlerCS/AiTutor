import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { username, full_name, email, password } = await req.json()

  if (!username || !full_name) {
    return NextResponse.json(
      { error: "Username and full name are required" },
      { status: 400 }
    )
  }

  if (!password) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 }
    )
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          full_name,
          email: email || null, // email is optional
          password_hash: hashedPassword,
        },
      ])
      .select("id")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "User created, but no ID returned" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Signup successful",
      userId: data[0].id,
    })
  } catch (err) {
    console.error("Signup error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
