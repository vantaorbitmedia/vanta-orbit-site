import { handleVideoSaveRequest } from "../save-handler";
import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { listDraftVideos } from "@/lib/video-persistence";

export async function GET() {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const drafts = await listDraftVideos();
    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Drafts could not be loaded.";
    console.error("[admin-api] draft list failed", { error: message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleVideoSaveRequest(request, "draft");
}
