import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { deleteDailyFacts, getDailyFactById, saveDailyFact, updateDailyFactStatus, type DailyFactSavePayload, type DailyFactStatus } from "@/lib/daily-space-facts";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const fact = await getDailyFactById(id);

  if (!fact) {
    return NextResponse.json({ success: false, error: "Daily fact not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, fact });
}

export async function PUT(request: Request, { params }: Props) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json() as { action?: string; status?: DailyFactStatus };
    if (body.action === "publish") {
      const fact = await updateDailyFactStatus(id, "published");
      return NextResponse.json({ success: true, fact });
    }
    if (body.action === "archive") {
      const fact = await updateDailyFactStatus(id, "archived");
      return NextResponse.json({ success: true, fact });
    }
    if (body.action === "ready") {
      const fact = await updateDailyFactStatus(id, "ready");
      return NextResponse.json({ success: true, fact });
    }

    const fact = await saveDailyFact({ ...(body as DailyFactSavePayload), id });
    return NextResponse.json({ success: true, fact });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Daily fact update failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await deleteDailyFacts([id]);
    if (result.deleted === 0) {
      return NextResponse.json({ success: false, error: "Daily fact not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Daily fact delete failed." },
      { status: 400 },
    );
  }
}
