import { NextResponse } from "next/server";
import { buildFallbackDailyFactContent, generateDailyFactContent } from "@/lib/daily-fact-ai";
import { activateDailySpaceFact, listDailyFacts } from "@/lib/daily-space-facts";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization") ?? "";
  const url = new URL(request.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date") || undefined;
  const facts = await listDailyFacts();
  const target = facts
    .filter((fact) => fact.publish_date <= (date || new Date().toISOString().slice(0, 10)) && fact.status !== "archived")
    .sort((a, b) => b.publish_date.localeCompare(a.publish_date))[0] ?? null;
  let generatedFields = undefined;
  let aiError = "";

  if (target) {
    const missingDraftFields = !target.detailed_explanation
      || !target.facebook_caption
      || !target.instagram_caption
      || !target.tiktok_caption
      || !target.youtube_caption
      || target.hashtags.length === 0
      || !target.leonardo_prompt
      || !target.card_headline
      || !target.card_subtext;

    if (missingDraftFields) {
      try {
        generatedFields = await generateDailyFactContent(target);
      } catch (error) {
        aiError = error instanceof Error ? error.message : "AI generation failed.";
        console.error("[daily-facts-cron] AI generation failed", { id: target.id, error: aiError });
        generatedFields = buildFallbackDailyFactContent(target.title, target.short_fact);
      }
    }
  }

  const result = await activateDailySpaceFact({ date, generatedFields });

  return NextResponse.json({
    success: true,
    ...result,
    aiError,
  });
}
