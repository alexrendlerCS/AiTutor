// my-app/lib/supabase-client.ts
"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { type SupabaseClient } from "@supabase/auth-helpers-nextjs";

export const supabase: SupabaseClient = createPagesBrowserClient();
