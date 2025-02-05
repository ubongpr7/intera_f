"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CreateAdAccountComponent } from "./createFunctions";

const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID";

const useFacebookAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadFacebookSDK = () => {
      if (window.FB) {
        setIsInitialized(true);
        return;
      }

      window.fbAsyncInit = function () {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v20.0",
        });
        setIsInitialized(true);
      };

      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.FB) {
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: "v20.0",
          });
          setIsInitialized(true);
        }
      };
      document.body.appendChild(script);
    };

    loadFacebookSDK();
  }, []);

  const loginWithFacebook = () => {
    if (!isInitialized || !window.FB) {
      toast.error("Facebook SDK not fully loaded. Please try again.");
      return;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const { accessToken, userID, expiresIn } = response.authResponse;
          setAccessToken(accessToken);
          setUserID(userID);
          setExpiresIn(expiresIn);

          // Send data to backend
          CreateAdAccountComponent(accessToken, userID);
        } else {
          toast.error("Facebook login failed or was cancelled.");
        }
      },
      { scope: "ads_management,ads_read,business_management,email,public_profile" }
    );
  };

  return {
    loginWithFacebook,
    accessToken,
    userID,
    expiresIn,
    isInitialized,
  };
};

export default useFacebookAuth;
