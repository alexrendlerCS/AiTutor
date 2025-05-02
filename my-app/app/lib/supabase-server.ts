// lib/supabase-server.ts
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs";

export function createSupabaseServerClient(): SupabaseClient {
  return createServerComponentClient({ cookies });
}
