import jwt_decode, { JwtPayload } from "jwt-decode";
import { setCookie, deleteCookie } from "cookies-next";

interface DecodedToken extends JwtPayload {
  id?: string;
  username?: string;
  first_name?: string;
  access_token?: string;
  [key: string]: any; // Allow additional properties
}

function setUserDataFromToken(token: string | null) {
  const cookieOptions = {
    sameSite: "strict",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 3 * 24 * 60 * 60,
  };

  const keysToStore: (keyof DecodedToken)[] = ["id", "username", "first_name", "access_token"];

  if (token) {
    try {
      const decoded: DecodedToken = jwt_decode<DecodedToken>(token);

      keysToStore.forEach((key) => {
        if (decoded[key]) {
          setCookie(key, decoded[key], cookieOptions);
        }
      });

      console.log("User data set from JWT:", decoded);
    } catch (error) {
      console.error("Error decoding JWT or setting cookies:", error);
      clearUserCookies(keysToStore);
    }
  } else {
    clearUserCookies(keysToStore);
  }
}

// Helper function to clear cookies
function clearUserCookies(keys: string[]) {
  keys.forEach((key) => deleteCookie(key, { path: "/" }));
}

export default setUserDataFromToken;
