export type AuthCookieKey =
  | "accessToken"
  | "refreshToken"
  | "userID"
  | "userFirstName"
  | "userLastName"
  | "userEmail"
  | "userPicture"
  | "profileId"
  | "profile"
  | "companyCode"
  | "companyName"
  | "companyLogo"
  | "currency"
  | "model_name"
  | "provider"
  | "agent_name"
  | "api_key"
  | "tavily_api_key"
  | "mfaVerified"
  | "mfaSetupRequired"
  | "mfaNextPath";

const rawPrefix = (process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX || "interaims").trim();
const normalizedPrefix = rawPrefix.endsWith("_") ? rawPrefix : `${rawPrefix}_`;
const allowLegacyCookieRead = (process.env.NEXT_PUBLIC_ALLOW_LEGACY_AUTH_COOKIES || "false").toLowerCase() === "true";

const withPrefix = (key: AuthCookieKey) => `${normalizedPrefix}${key}`;

export const AUTH_COOKIE_NAMES: Record<AuthCookieKey, string> = {
  accessToken: withPrefix("accessToken"),
  refreshToken: withPrefix("refreshToken"),
  userID: withPrefix("userID"),
  userFirstName: withPrefix("userFirstName"),
  userLastName: withPrefix("userLastName"),
  userEmail: withPrefix("userEmail"),
  userPicture: withPrefix("userPicture"),
  profileId: withPrefix("profileId"),
  profile: withPrefix("profile"),
  companyCode: withPrefix("companyCode"),
  companyName: withPrefix("companyName"),
  companyLogo: withPrefix("companyLogo"),
  currency: withPrefix("currency"),
  model_name: withPrefix("model_name"),
  provider: withPrefix("provider"),
  agent_name: withPrefix("agent_name"),
  api_key: withPrefix("api_key"),
  tavily_api_key: withPrefix("tavily_api_key"),
  mfaVerified: withPrefix("mfaVerified"),
  mfaSetupRequired: withPrefix("mfaSetupRequired"),
  mfaNextPath: withPrefix("mfaNextPath"),
};

const LEGACY_COOKIE_NAMES: Record<AuthCookieKey, string> = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  userID: "userID",
  userFirstName: "userFirstName",
  userLastName: "userLastName",
  userEmail: "userEmail",
  userPicture: "userPicture",
  profileId: "profileId",
  profile: "profile",
  companyCode: "companyCode",
  companyName: "companyName",
  companyLogo: "companyLogo",
  currency: "currency",
  model_name: "model_name",
  provider: "provider",
  agent_name: "agent_name",
  api_key: "api_key",
  tavily_api_key: "tavily_api_key",
  mfaVerified: "mfaVerified",
  mfaSetupRequired: "mfaSetupRequired",
  mfaNextPath: "mfaNextPath",
};

export const AUTH_COOKIE_KEYS: AuthCookieKey[] = Object.keys(AUTH_COOKIE_NAMES) as AuthCookieKey[];

export const getCookieCandidates = (key: AuthCookieKey): string[] => {
  if (!allowLegacyCookieRead) {
    return [AUTH_COOKIE_NAMES[key]];
  }
  const names = [AUTH_COOKIE_NAMES[key], LEGACY_COOKIE_NAMES[key]];
  return names[0] === names[1] ? [names[0]] : names;
};

export const readCookieValue = (
  key: AuthCookieKey,
  getter: (name: string) => unknown,
): string | undefined => {
  for (const name of getCookieCandidates(key)) {
    const value = getter(name);
    if (value !== undefined && value !== null && `${value}`.length > 0) {
      return `${value}`;
    }
  }
  return undefined;
};
