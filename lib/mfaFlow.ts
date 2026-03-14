import { deleteCookie, setCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { AUTH_COOKIE_NAMES, getCookieCandidates } from "./authCookies";

interface MfaTokenClaims {
  mfa_enabled?: boolean;
  has_setup_mfa?: boolean;
}

const MFA_COOKIE_AGE = 60 * 60 * 24;

export const initializeMfaChallenge = (
  nextPath: string,
  accessToken?: string,
): "/accounts/mfa/setup" | "/accounts/mfa/verify" => {
  setCookie(AUTH_COOKIE_NAMES.mfaVerified, "false", { maxAge: MFA_COOKIE_AGE, path: "/" });
  setCookie(AUTH_COOKIE_NAMES.mfaNextPath, nextPath, { maxAge: MFA_COOKIE_AGE, path: "/" });

  if (accessToken) {
    try {
      const claims = jwtDecode<MfaTokenClaims>(accessToken);
      if (claims.mfa_enabled === true || claims.has_setup_mfa === true) {
        setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "false", { maxAge: MFA_COOKIE_AGE, path: "/" });
        return "/accounts/mfa/verify";
      }
      if (claims.mfa_enabled === false && claims.has_setup_mfa === false) {
        setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "true", { maxAge: MFA_COOKIE_AGE, path: "/" });
        return "/accounts/mfa/setup";
      }
    } catch {
      // fallback to default route below
    }
  }

  setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "false", { maxAge: MFA_COOKIE_AGE, path: "/" });
  return "/accounts/mfa/verify";
};

export const markMfaVerified = () => {
  setCookie(AUTH_COOKIE_NAMES.mfaVerified, "true", { maxAge: MFA_COOKIE_AGE, path: "/" });
  setCookie(AUTH_COOKIE_NAMES.mfaSetupRequired, "false", { maxAge: MFA_COOKIE_AGE, path: "/" });
};

export const clearMfaCookies = () => {
  for (const name of getCookieCandidates("mfaVerified")) {
    deleteCookie(name);
  }
  for (const name of getCookieCandidates("mfaSetupRequired")) {
    deleteCookie(name);
  }
  for (const name of getCookieCandidates("mfaNextPath")) {
    deleteCookie(name);
  }
};
