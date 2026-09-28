import { getFrontendOrigin } from "@/lib/frontendOrigin";

export type SocialProvider = "google" | "facebook" | "microsoft";
export type SocialProviderSlug = "google-oauth2" | "facebook" | "microsoft-graph";

const providerSlugMap: Record<SocialProvider, SocialProviderSlug> = {
  google: "google-oauth2",
  facebook: "facebook",
  microsoft: "microsoft-graph",
};

const parseRedirectMap = () => {
  const envMap = process.env.NEXT_PUBLIC_SOCIAL_REDIRECT_URIS ?? "";
  const entries = envMap
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [key, value] = item.split(">");
      return [key?.trim(), value?.trim()] as const;
    })
    .filter(([key, value]) => Boolean(key) && Boolean(value));

  return Object.fromEntries(entries) as Partial<Record<SocialProvider, string>>;
};

const getRedirectUri = (provider: SocialProvider) => {
  const redirectMap = parseRedirectMap();
  const envValue = redirectMap[provider];
  if (envValue) return envValue;

  if (provider === "google") {
    return process.env.NEXT_PUBLIC_SOCIAL_GOOGLE_REDIRECT_URI ?? "";
  }
  if (provider === "facebook") {
    return process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_REDIRECT_URI ?? "";
  }
  return process.env.NEXT_PUBLIC_SOCIAL_MICROSOFT_REDIRECT_URI ?? "";
};

const extractAuthorizationUrl = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as { authorization_url?: string };
    return data.authorization_url;
  }

  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { authorization_url?: string };
    return parsed.authorization_url;
  } catch {
    return undefined;
  }
};

export const continueWithSocialAuth = async (
  provider: SocialProvider,
  options?: { signup?: boolean; termsAccepted?: boolean; privacyAccepted?: boolean },
) => {
  const backend = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? "").replace(/\/+$/, "");
  const redirectUri = getRedirectUri(provider);

  if (!backend) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_HOST_URL.");
  }
  if (!redirectUri) {
    throw new Error(`Missing redirect URI for provider: ${provider}.`);
  }

  const providerSlug = providerSlugMap[provider];
  const query = new URLSearchParams({ redirect_uri: redirectUri });
  if (options?.signup) {
    query.set('signup', '1');
    query.set('terms_accepted', String(options.termsAccepted === true));
    query.set('privacy_accepted', String(options.privacyAccepted === true));
  }
  const url = `${backend}/auth/o/${providerSlug}/?${query.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(getFrontendOrigin() ? { "X-Intera-Frontend-Origin": getFrontendOrigin() } : {}),
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to initiate social auth (${response.status}).`);
  }

  const authorizationUrl = await extractAuthorizationUrl(response);
  if (!authorizationUrl) {
    throw new Error("Authorization URL missing from provider response.");
  }

  window.location.assign(authorizationUrl);
};

export const socialProviderFromSlug = (slug: string): SocialProviderSlug | null => {
  const normalized = slug.trim().toLowerCase();
  if (normalized === "google" || normalized === "google-oauth2") return "google-oauth2";
  if (normalized === "facebook") return "facebook";
  if (normalized === "microsoft" || normalized === "microsoft-graph") return "microsoft-graph";
  return null;
};

export const socialRedirectForProviderSlug = (slug: string): string => {
  const providerSlug = socialProviderFromSlug(slug);
  if (providerSlug === "google-oauth2") return getRedirectUri("google");
  if (providerSlug === "facebook") return getRedirectUri("facebook");
  if (providerSlug === "microsoft-graph") return getRedirectUri("microsoft");
  return "";
};
