import { NextResponse } from "next/server";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    // A filled honeypot indicates an automated submission. Keep accepting the
    // legacy field while clients roll over to the neutral field name.
    const honeypot = typeof body.contact_reference === "string"
      ? body.contact_reference
      : typeof body.website === "string"
        ? body.website
        : "";
    if (honeypot.trim()) {
      return NextResponse.json({ ok: true, accepted: false }, { status: 202 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const interest = typeof body.interest === "string" ? body.interest.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.CONTACT_TO_EMAIL;
    const sender = process.env.CONTACT_FROM_EMAIL;

    if (!apiKey || !recipient || !sender) {
      console.error("Contact form is not configured: set RESEND_API_KEY, CONTACT_TO_EMAIL, and CONTACT_FROM_EMAIL.");
      return NextResponse.json({ error: "The contact service is temporarily unavailable. Please email us directly." }, { status: 503 });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = escapeHtml(company || "Not provided");
    const safeInterest = escapeHtml(interest || "Not provided");
    const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: `New Intera IMS enquiry from ${name}`,
        html: `
          <h2>New Intera IMS enquiry</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Business:</strong> ${safeCompany}</p>
          <p><strong>Interest:</strong> ${safeInterest}</p>
          <p><strong>Message:</strong></p>
          <p>${safeMessage}</p>
        `,
      }),
    });

    const providerDetails = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Contact email provider rejected the message:", {
        status: response.status,
        details: providerDetails,
      });
      return NextResponse.json({ error: "We could not send your message. Please try again shortly." }, { status: 502 });
    }

    const messageId = typeof providerDetails?.id === "string" ? providerDetails.id : "";
    if (!messageId) {
      console.error("Contact email provider returned success without a message ID:", providerDetails);
      return NextResponse.json({ error: "We could not confirm delivery. Please try again shortly." }, { status: 502 });
    }

    console.info("Intera IMS contact email accepted by Resend:", {
      messageId,
      recipient,
    });
    return NextResponse.json({ ok: true, accepted: true });
  } catch (error) {
    console.error("Contact form request failed:", error);
    return NextResponse.json({ error: "We could not send your message. Please try again shortly." }, { status: 500 });
  }
}
