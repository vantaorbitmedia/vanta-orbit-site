import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { generateDailyFactContent } from "@/lib/daily-fact-ai";
import { checkRateLimit } from "@/lib/server-rate-limit";

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit("generate-fact-content", 20, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many AI generation requests. Try again later." }, { status: 429 });
  }

  try {
    const body = await request.json() as { title?: string; short_fact?: string };
    const title = body.title?.trim() ?? "";
    const shortFact = body.short_fact?.trim() ?? "";

    if (!title || !shortFact) {
      return NextResponse.json({ error: "title and short_fact are required." }, { status: 400 });
    }

    const content = await generateDailyFactContent({ title, short_fact: shortFact });
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI content generation failed." },
      { status: 500 },
    );
  }
}
