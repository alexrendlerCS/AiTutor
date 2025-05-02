// my-app/app/api/progress/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const subject = searchParams.get("subject");

  if (!user_id || !subject) {
    return NextResponse.json(
      { error: "Missing user_id or subject" },
      { status: 400 }
    );
  }

  // Try to fetch progress
  const { data, error } = await supabase
    .from("user_progress")
    .select("xp, level")
    .eq("user_id", user_id)
    .eq("subject_id", subject)
    .single();

  if (error) {
    console.warn("Progress not found, inserting default:", error.message);

    // Insert default row
    const insertRes = await supabase.from("user_progress").insert({
      user_id,
      subject_id: subject,
      xp: 0,
      level: 1,
    });

    if (insertRes.error) {
      console.error(
        "Failed to insert default progress row:",
        insertRes.error.message
      );
    }

    return NextResponse.json({ xp: 0, level: 1 });
  }

  return NextResponse.json(data);
}
