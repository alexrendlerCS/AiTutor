// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies: () => cookies() });
  const { username, full_name, email, password } = await req.json();

  if (!username || !full_name || !email || !password) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name,
        },
      },
    });

    if (error) {
      console.error("❌ Signup error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Signup succeeded but no user returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Signup successful",
      userId: data.user.id,
    });
  } catch (err: any) {
    console.error("🔥 Unexpected error:", err.message || err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
