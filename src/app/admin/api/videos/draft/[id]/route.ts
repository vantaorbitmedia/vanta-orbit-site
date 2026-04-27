import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { deleteDraftVideo } from "@/lib/video-persistence";

export async function DELETE(_request: Request, context: RouteContext<"/admin/api/videos/draft/[id]">) {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const draft = await deleteDraftVideo(id);
    return NextResponse.json({ success: true, draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft could not be deleted.";
    console.error("[admin-api] draft delete failed", { error: message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
