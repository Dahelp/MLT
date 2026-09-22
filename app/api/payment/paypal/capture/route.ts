import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("token");
  const reference = url.searchParams.get("reference") || "";
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const apiBase = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  if (!orderId || !clientId || !secret) return NextResponse.redirect(new URL(`/plan?payment=error&reference=${encodeURIComponent(reference)}`, url.origin));
  try {
    const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
    const tokenResult = await tokenResponse.json() as { access_token?: string };
    if (!tokenResult.access_token) throw new Error("Missing PayPal access token");
    const capture = await fetch(`${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST", headers: { Authorization: `Bearer ${tokenResult.access_token}`, "Content-Type": "application/json" }, body: "{}" });
    if (!capture.ok) throw new Error("PayPal capture failed");
    return NextResponse.redirect(new URL(`/plan?payment=success&reference=${encodeURIComponent(reference)}`, url.origin));
  } catch { return NextResponse.redirect(new URL(`/plan?payment=error&reference=${encodeURIComponent(reference)}`, url.origin)); }
}
