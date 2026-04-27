import { handleVideoSaveRequest } from "../save-handler";

export async function POST(request: Request) {
  return handleVideoSaveRequest(request, "published");
}
