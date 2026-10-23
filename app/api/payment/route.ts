import { NextResponse } from "next/server";

// Payments must use the authenticated PHP checkout and settlement handlers.
export async function POST() {
  return NextResponse.json({ error: "Use the account checkout to continue." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
