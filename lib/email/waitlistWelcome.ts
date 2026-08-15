const BRAND = {
  deepBlue: "#101727",
  brightBlue: "#3c83f7",
  lightGreen: "#98fcc2",
  surface: "#f5f9ff",
  text: "#42526b",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

export function buildWaitlistWelcomeEmail({
  name,
  siteUrl,
  contactEmail,
}: {
  name?: string;
  siteUrl: string;
  contactEmail: string;
}) {
  const greeting = name ? `Hello ${escapeHtml(name)},` : "Hello,";
  const safeSiteUrl = escapeAttribute(siteUrl);
  const safeContactEmail = escapeAttribute(contactEmail);
  const logoUrl = `${siteUrl}/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-WHITE-4.png`;
  const safeLogoUrl = escapeAttribute(logoUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Welcome to the Intera IMS waitlist</title>
    <style>
      body { margin: 0; padding: 0; background: ${BRAND.surface}; color: ${BRAND.deepBlue}; font-family: Arial, Helvetica, sans-serif; }
      .wrap { width: 100%; padding: 36px 16px; background: linear-gradient(180deg, ${BRAND.surface} 0%, #edf5ff 100%); }
      .card { max-width: 720px; margin: 0 auto; overflow: hidden; background: #ffffff; border: 1px solid #d9e6ff; border-radius: 26px; box-shadow: 0 18px 48px rgba(16, 23, 39, 0.10); }
      .header { padding: 42px 48px 46px; background: ${BRAND.deepBlue}; color: #ffffff; }
      .brand-logo { display: block; width: 176px; max-width: 176px; height: auto; margin-bottom: 42px; border: 0; }
      .eyebrow { color: ${BRAND.lightGreen}; font-size: 13px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
      h1 { margin: 14px 0 0; color: #ffffff; font-size: 36px; line-height: 1.12; letter-spacing: -.03em; }
      .content { padding: 42px 48px 30px; }
      p { margin: 0 0 16px; color: ${BRAND.text}; font-size: 16px; line-height: 1.6; }
      .highlight { margin: 24px 0; padding: 20px 22px; border: 1px solid #d9e6ff; border-radius: 18px; background: ${BRAND.surface}; }
      .highlight strong { display: block; margin-bottom: 6px; color: ${BRAND.deepBlue}; font-size: 16px; }
      .cta { display: inline-block; margin: 6px 0 20px; padding: 14px 24px; border-radius: 14px; background: ${BRAND.brightBlue}; color: #ffffff !important; font-weight: 700; text-decoration: none; }
      a { color: ${BRAND.brightBlue}; }
      .footer { padding: 0 48px 36px; color: #6b7280; font-size: 13px; line-height: 1.6; }
      @media (prefers-color-scheme: dark) {
        body, .wrap { background: ${BRAND.deepBlue} !important; }
        .card { background: #151f33 !important; border-color: #27364f !important; }
        .content { background: #151f33 !important; }
        p { color: #d1d5db !important; }
        .highlight { border-color: #27364f !important; background: ${BRAND.deepBlue} !important; }
        .highlight strong { color: #ffffff !important; }
        .footer { color: #aeb8c8 !important; }
      }
      @media only screen and (max-width: 640px) {
        .wrap { padding: 16px 10px; }
        .header, .content { padding-left: 22px; padding-right: 22px; }
        .header { padding-top: 32px; padding-bottom: 36px; }
        .brand-logo { width: 148px !important; max-width: 148px !important; margin-bottom: 34px; }
        .footer { padding-left: 20px; padding-right: 20px; }
        h1 { font-size: 28px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="header">
          <img class="brand-logo" src="${safeLogoUrl}" width="176" alt="Intera IMS" />
          <div class="eyebrow">Waitlist confirmed</div>
          <h1>Welcome to Intera IMS</h1>
        </div>
        <div class="content">
          <p>${greeting}</p>
          <p>Thank you for joining the Intera IMS waitlist. We are building a clearer way for businesses to control inventory, coordinate operations, and make better decisions from one place.</p>
          <div class="highlight">
            <strong>You are on the list.</strong>
            We will email you when the launch date is announced and share the next steps as access becomes available.
          </div>
          <p>If you have a question, want to discuss your operation, or would like to learn more before launch, contact us directly at <a href="mailto:${safeContactEmail}">${safeContactEmail}</a>.</p>
          <a class="cta" href="${safeSiteUrl}">Visit Intera IMS</a>
          <p>We look forward to having you with us.</p>
        </div>
        <div class="footer">
          This is an automated message from Intera IMS. Please reply to this email or contact <a href="mailto:${safeContactEmail}">${safeContactEmail}</a> for help.<br />
          <a href="${safeSiteUrl}">${safeSiteUrl}</a>
        </div>
      </div>
    </div>
  </body>
</html>`;
}
