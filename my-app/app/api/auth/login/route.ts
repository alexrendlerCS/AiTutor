import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies: () => cookies() });

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || "Invalid credentials" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: "Login successful",
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || null,
      username: data.user.user_metadata?.username || null,
    },
  });
}
