import { NextResponse } from "next/server";

type Provider = "stripe" | "paypal";

const prices: Record<string, Record<number, number>> = {
  freedom: { 7: 1490, 10: 1990, 14: 2590, 21: 3690, 30: 4990 },
  signature: { 7: 2490, 10: 3557, 14: 4980, 21: 7470, 30: 10671 },
  concierge: { 7: 4990, 10: 7129, 14: 9980, 21: 14970, 30: 21386 },
  private: { 7: 19900, 10: 28429, 14: 39800, 21: 59700, 30: 85286 },
};
const freedomPlusPrices: Record<number, number> = { 7: 1790, 10: 2340, 14: 3040, 21: 4190, 30: 5490 };

const clean = (value: unknown, max = 80) => String(value ?? "").trim().slice(0, max);
const encode = (value: Record<string, string>) => new URLSearchParams(value).toString();

export async function POST(request: Request) {
  let body: { provider?: Provider; collection?: unknown; days?: unknown; reference?: unknown; extraGuests?: unknown; freedomPlus?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid payment request" }, { status: 400 }); }
  const provider = body.provider;
  const collection = clean(body.collection).toLowerCase();
  const days = Number(body.days);
  const baseAmount = collection === "freedom" && body.freedomPlus ? freedomPlusPrices[days] : prices[collection]?.[days];
  const extraGuests = Math.max(0, Math.min(6, Number(body.extraGuests) || 0));
  const amount = baseAmount ? baseAmount + extraGuests * 190 : 0;
  const reference = clean(body.reference);
  if ((provider !== "stripe" && provider !== "paypal") || !amount || !reference) return NextResponse.json({ error: "This journey cannot be paid online yet. Please contact MLT Concierge." }, { status: 400 });

  const origin = new URL(request.url).origin;
  const description = `MLT ${collection} Collection · ${days} days`;
  if (provider === "stripe") {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${secret}:`)}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: encode({ mode: "payment", "success_url": `${origin}/plan?payment=success&reference=${encodeURIComponent(reference)}`, "cancel_url": `${origin}/plan?payment=cancelled&reference=${encodeURIComponent(reference)}`, "client_reference_id": reference, "line_items[0][price_data][currency]": "eur", "line_items[0][price_data][product_data][name]": description, "line_items[0][price_data][unit_amount]": String(amount * 100), "line_items[0][quantity]": "1" }),
    });
    const result = await response.json() as { url?: string; error?: { message?: string } };
    if (!response.ok || !result.url) return NextResponse.json({ error: result.error?.message || "Unable to start Stripe checkout." }, { status: 502 });
    return NextResponse.json({ url: result.url });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const apiBase = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  if (!clientId || !secret) return NextResponse.json({ error: "PayPal is not configured yet." }, { status: 503 });
  const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  const tokenResult = await tokenResponse.json() as { access_token?: string };
  if (!tokenResponse.ok || !tokenResult.access_token) return NextResponse.json({ error: "Unable to authenticate with PayPal." }, { status: 502 });
  const orderResponse = await fetch(`${apiBase}/v2/checkout/orders`, { method: "POST", headers: { Authorization: `Bearer ${tokenResult.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ reference_id: reference, description, amount: { currency_code: "EUR", value: amount.toFixed(2) } }], application_context: { return_url: `${origin}/api/payment/paypal/capture?reference=${encodeURIComponent(reference)}`, cancel_url: `${origin}/plan?payment=cancelled&reference=${encodeURIComponent(reference)}`, user_action: "PAY_NOW" } }) });
  const orderResult = await orderResponse.json() as { links?: { rel: string; href: string }[] };
  const approvalUrl = orderResult.links?.find((link) => link.rel === "approve")?.href;
  if (!orderResponse.ok || !approvalUrl) return NextResponse.json({ error: "Unable to start PayPal checkout." }, { status: 502 });
  return NextResponse.json({ url: approvalUrl });
}
