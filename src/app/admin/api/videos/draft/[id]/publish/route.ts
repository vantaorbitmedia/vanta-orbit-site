import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { publishDraftVideo } from "@/lib/video-persistence";

export async function POST(_request: Request, context: RouteContext<"/admin/api/videos/draft/[id]/publish">) {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const video = await publishDraftVideo(id);
    return NextResponse.json({ success: true, video });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft could not be published.";
    console.error("[admin-api] draft publish failed", { error: message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
