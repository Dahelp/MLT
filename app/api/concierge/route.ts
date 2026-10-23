import { NextResponse } from "next/server";

// The production PHP endpoint provides validation, persistence and abuse limits.
export async function POST() {
  return NextResponse.json({ error: "Use the site contact form to continue." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
