import { createClient } from "@supabase/supabase-js";

// Browser Supabase client. NEXT_PUBLIC_SUPABASE_ANON_KEY is expected to be
// public; database access must be constrained by Supabase RLS policies.
// TODO before full public launch: make sure client-side anon access cannot
// INSERT/UPDATE admin-managed content directly.

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createClient(supabaseUrl, anonKey);
}
