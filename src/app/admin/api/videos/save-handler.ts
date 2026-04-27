import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { persistVideo, type VideoSavePayload } from "@/lib/video-persistence";
import type { ContentStatus } from "@/lib/content";

export async function handleVideoSaveRequest(request: Request, status: ContentStatus) {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: VideoSavePayload;
    try {
      body = (await request.json()) as VideoSavePayload;
    } catch (error) {
      console.error("[admin-api] invalid video save JSON", error);
      return NextResponse.json({ success: false, error: "Invalid JSON request body." }, { status: 400 });
    }

    const result = await persistVideo(body, status);

    if (!result.ok) {
      console.error("[admin-api] video save failed", {
        status,
        errors: result.errors,
        schemaDiagnostics: result.schemaDiagnostics,
      });
      return NextResponse.json({
        success: false,
        error: result.errors.join(" "),
        ...result,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      draft: status === "draft" ? result.video : undefined,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed.";
    console.error("[admin-api] unhandled video save error", {
      status,
      error: message,
    });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
