import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { deleteDailyFacts, listDailyFacts, saveDailyFact, type DailyFactSavePayload } from "@/lib/daily-space-facts";

export async function GET() {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const facts = await listDailyFacts();
  return NextResponse.json({ success: true, facts });
}

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as DailyFactSavePayload;
    const fact = await saveDailyFact(body);
    return NextResponse.json({ success: true, fact });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Daily fact save failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as { ids?: unknown };
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: "No daily fact IDs provided." }, { status: 400 });
    }

    const result = await deleteDailyFacts(ids);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Daily fact delete failed." },
      { status: 400 },
    );
  }
}
