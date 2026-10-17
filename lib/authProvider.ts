const MFA_BYPASS_PROVIDERS = new Set(["google", "google-oauth2"]);

/** SSO providers whose upstream authentication already verified the user. */
export const isSsoMfaBypassProvider = (provider?: string | null) =>
  MFA_BYPASS_PROVIDERS.has(`${provider ?? ""}`.trim().toLowerCase());
