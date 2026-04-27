import { handleVideoSaveRequest } from "./save-handler";

export async function POST(request: Request) {
  let body: { status?: string } = {};
  try {
    body = (await request.clone().json()) as { status?: string };
  } catch {
    return handleVideoSaveRequest(request, "draft");
  }
  const status = body.status === "published" ? "published" : "draft";
  return handleVideoSaveRequest(request, status);
}
