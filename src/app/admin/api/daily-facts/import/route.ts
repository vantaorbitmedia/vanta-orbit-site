import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { importDailyFactsToSupabase, validateDailyFactImport } from "@/lib/daily-space-facts-import";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";

type ImportRequest = {
  facts?: unknown;
  force?: boolean;
  allowDuplicatePublishDates?: boolean;
  allowDuplicateSlugs?: boolean;
  dryRun?: boolean;
};

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: ImportRequest;
  try {
    body = await request.json() as ImportRequest;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON request body." }, { status: 400 });
  }

  const options = {
    force: Boolean(body.force),
    allowDuplicatePublishDates: Boolean(body.allowDuplicatePublishDates),
    allowDuplicateSlugs: Boolean(body.allowDuplicateSlugs),
  };

  if (body.dryRun) {
    const validation = validateDailyFactImport(body.facts, options);
    return NextResponse.json({
      success: validation.errors.length === 0,
      total: Array.isArray(body.facts) ? body.facts.length : 0,
      valid: validation.facts.length,
      errors: validation.errors,
    }, { status: validation.errors.length === 0 ? 200 : 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  const result = await importDailyFactsToSupabase(getSupabaseAdminClient(), body.facts, options);

  return NextResponse.json({
    success: result.ok,
    ...result,
  }, { status: result.ok ? 200 : 400 });
}
