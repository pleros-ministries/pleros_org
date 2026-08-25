import { NextResponse } from "next/server";

import {
  linkSogpTelegramIdentity,
  getSogpDashboardData,
} from "@/lib/db/queries/sogp";
import {
  getSogpTelegramLinkSecret,
  hashSogpTelegramStartToken,
  parseSogpTelegramStart,
} from "@/lib/telegram/sogp";

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_SOGP_WEBHOOK_SECRET;
  const providedSecret = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const update = await request.json().catch(() => null);
  const start = parseSogpTelegramStart(update ?? {});
  if (!start) return NextResponse.json({ ok: true });
  const enrollment = await linkSogpTelegramIdentity({
    tokenHash: hashSogpTelegramStartToken(
      start.token,
      getSogpTelegramLinkSecret(process.env),
    ),
    telegramUserId: start.telegramUserId,
    telegramChatId: start.chatId,
  });
  if (!enrollment) return NextResponse.json({ ok: true });
  const data = await getSogpDashboardData(enrollment.userId);
  const token = process.env.TELEGRAM_SOGP_BOT_TOKEN;
  if (token) {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://pleros.org"}/dashboard/sogp`;
    const discussion = data?.cohort.telegramDiscussionUrl;
    const text = [
      `Welcome to ${data?.cohort.title ?? "SOGP"}.`,
      `Dashboard: ${dashboardUrl}`,
      discussion ? `Community: ${discussion}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: start.chatId, text }),
    });
  }
  return NextResponse.json({ ok: true });
}
