import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("❌ User fetch failed:", error?.message || "No user found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || "",
    username: user.user_metadata?.username || "",
  });
}
