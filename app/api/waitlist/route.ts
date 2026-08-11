import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistPayload = {
  email?: unknown;
  name?: unknown;
  consent?: unknown;
  website?: unknown;
};

export async function POST(request: Request) {
  const databaseUrl = process.env.WAITLIST_DATABASE_URL?.trim();

  if (!databaseUrl) {
    return NextResponse.json(
      { ok: false, message: "The waitlist is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: WaitlistPayload;
  try {
    payload = (await request.json()) as WaitlistPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Please submit the form again." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Silently accept honeypot submissions so bots do not learn whether they were detected.
  if (typeof payload.website === "string" && payload.website.trim()) {
    return NextResponse.json(
      { ok: true, accepted: false },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 120) : "";

  if (!emailPattern.test(email) || email.length > 254) {
    return NextResponse.json(
      { ok: false, message: "Enter a valid email address." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (payload.consent !== true) {
    return NextResponse.json(
      { ok: false, message: "Please confirm that you want to receive launch updates." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const sql = neon(databaseUrl);

    // The temporary waitlist is self-initializing so the frontend can be deployed independently.
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist_signups (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        source TEXT NOT NULL DEFAULT 'interaims-homepage',
        consent BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const inserted = await sql`
      INSERT INTO waitlist_signups (email, name, source, consent)
      VALUES (${email}, ${name || null}, 'interaims-homepage', TRUE)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    return NextResponse.json(
      { ok: true, accepted: true, alreadyRegistered: inserted.length === 0 },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Waitlist submission failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { ok: false, message: "We could not save your signup. Please try again shortly." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
