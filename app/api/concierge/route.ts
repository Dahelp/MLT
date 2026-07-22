import { NextResponse } from "next/server";

type ConciergeRequest = {
  firstName?: unknown; lastName?: unknown; email?: unknown; phone?: unknown;
  preferredContact?: unknown; bestTime?: unknown; notes?: unknown;
  collection?: unknown; country?: unknown; guests?: unknown; days?: unknown;
  route?: unknown; rate?: unknown; website?: unknown;
};

const clean = (value: unknown, max = 300) => String(value ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  let body: ConciergeRequest;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  if (clean(body.website)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const firstName = clean(body.firstName, 80);
  const lastName = clean(body.lastName, 80);
  const email = clean(body.email, 160);
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please provide a valid name and email" }, { status: 400 });

  const reference = `MLT-${Date.now().toString(36).toUpperCase()}`;
  const route = Array.isArray(body.route) ? body.route.map((item) => clean(item, 80)).filter(Boolean).slice(0, 12) : [];
  const lines = [
    "◆ NEW MLT PRIVATE REQUEST", `Reference: ${reference}`, "",
    `Client: ${firstName} ${lastName}`, `Email: ${email}`, `Phone: ${clean(body.phone, 80) || "Not provided"}`,
    `Preferred contact: ${clean(body.preferredContact, 40) || "Email"}`, `Best time: ${clean(body.bestTime, 40) || "Not specified"}`, "",
    `Collection: ${clean(body.collection, 80)}`, `Starting country: ${clean(body.country, 80)}`,
    `Travellers: ${clean(body.guests, 40)}`, `Duration: ${clean(body.days, 20)} days`, `Indicative rate: ${clean(body.rate, 80)}`,
    `Route: ${route.length ? route.join(" → ") : "To be curated"}`, "", `Notes: ${clean(body.notes, 800) || "No additional notes"}`,
  ];

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return NextResponse.json({ ok: true, reference, delivery: "demo" });

  try {
    const telegram = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), disable_web_page_preview: true }),
    });
    const result = await telegram.json() as { ok?: boolean; description?: string };
    if (!telegram.ok || !result.ok) throw new Error(result.description || "Telegram delivery failed");
    return NextResponse.json({ ok: true, reference, delivery: "telegram" });
  } catch (error) {
    console.error("Telegram concierge delivery failed", error);
    return NextResponse.json({ error: "Your request could not be delivered. Please try again." }, { status: 502 });
  }
}
