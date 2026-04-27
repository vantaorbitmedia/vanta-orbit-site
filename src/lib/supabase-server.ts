import { createClient } from "@supabase/supabase-js";
import { warnMissingServerEnv } from "@/lib/env";

// Server-only Supabase client. The service role key must never be imported into
// client components or exposed through NEXT_PUBLIC_* variables.
// TODO before full public launch: tighten Supabase RLS policies and keep
// INSERT/UPDATE/DELETE paths restricted to trusted server-side routes.

export function isSupabaseConfigured() {
  warnMissingServerEnv("NEXT_PUBLIC_SUPABASE_URL", "Supabase persistence");
  warnMissingServerEnv("SUPABASE_SERVICE_ROLE_KEY", "Supabase persistence");

  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
