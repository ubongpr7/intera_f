import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { buildWaitlistWelcomeEmail } from "@/lib/email/waitlistWelcome";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistPayload = {
  email?: unknown;
  name?: unknown;
  consent?: unknown;
  website?: unknown;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function getEnvValue(name: string) {
  return process.env[name]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

async function sendWaitlistWelcomeEmail({ email, name }: { email: string; name: string }) {
  const apiKey = getEnvValue("RESEND_API_KEY");
  const sender = getEnvValue("CONTACT_FROM_EMAIL");
  const contactEmail = getEnvValue("CONTACT_TO_EMAIL") || "business@interapro.tech";

  if (!apiKey || !sender) {
    console.error("Waitlist welcome email is not configured: set RESEND_API_KEY and CONTACT_FROM_EMAIL.");
    return false;
  }

  const siteUrl = getEnvValue("NEXT_PUBLIC_SITE_URL") || "https://www.interaims.com";
  const html = buildWaitlistWelcomeEmail({ name, siteUrl, contactEmail });

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [email],
        reply_to: contactEmail,
        subject: "Welcome to the Intera IMS waitlist",
        html,
      }),
    });

    const providerDetails = await response.json().catch(() => ({}));
    if (!response.ok || typeof providerDetails?.id !== "string") {
      console.error("Waitlist welcome email was not accepted by Resend:", {
        status: response.status,
        details: providerDetails,
        recipient: email,
      });
      return false;
    }

    console.info("Intera IMS waitlist welcome email accepted by Resend:", {
      messageId: providerDetails.id,
      recipient: email,
    });
    return true;
  } catch (error) {
    console.error("Waitlist welcome email request failed:", {
      recipient: email,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return false;
  }
}

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

    const alreadyRegistered = inserted.length === 0;
    const emailSent = alreadyRegistered
      ? false
      : await sendWaitlistWelcomeEmail({ email, name });

    return NextResponse.json(
      { ok: true, accepted: true, alreadyRegistered, emailSent },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Waitlist submission failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json(
      { ok: false, message: "We could not save your signup. Please try again shortly." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
