
"use client";

import env from "@/env_file";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useCreateAdAccountMutation } from "@/redux/features/adAccountApiSlice"; 

const FACEBOOK_APP_ID = env.FACEBOOK_APP_ID;

const useFacebookAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [createAdAccount] = useCreateAdAccountMutation(); // Mutation to send data to backend

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
      document.body.appendChild(script);
    };

    loadFacebookSDK();
  }, []);

  const loginWithFacebook = () => {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded. Please try again.");
      return;
    }

    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          const { accessToken, userID } = response.authResponse;
          setAccessToken(accessToken);
          setUserID(userID);

          try {
            await createAdAccount({ ad_account_id: userID, access_token: accessToken }).unwrap();
            toast.success("Ad account successfully created!");
          } catch (error: any) {
            console.error("Error creating ad account:", error);
            toast.error("Failed to create ad account.");
          }
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
    isInitialized,
  };
};

export default useFacebookAuth;

// "use client";

// import env from "@/env_file";
// import { useState, useEffect } from "react";
// import { toast } from "react-toastify";
// import { useCreateAdAccountMutation } from "@/redux/features/adAccountApiSlice";
// const FACEBOOK_APP_ID =env.FACEBOOK_APP_ID;

// const useFacebookAuth = () => {
//   const [accessToken, setAccessToken] = useState<string | null>(null);
//   const [userID, setUserID] = useState<string | null>(null);
//   const [expiresIn, setExpiresIn] = useState<number | null>(null);
//   const [isInitialized, setIsInitialized] = useState(false);
//     const [createAd]=useCreateAdAccountMutation();
//   useEffect(() => {
//     const loadFacebookSDK = () => {
//       if (window.FB) {
//         setIsInitialized(true);
//         return;
//       }

//       window.fbAsyncInit = function () {
//         window.FB.init({
//           appId: FACEBOOK_APP_ID,
//           cookie: true,
//           xfbml: true,
//           version: "v20.0",
//         });
//         setIsInitialized(true);
//       };

//       const script = document.createElement("script");
//       script.src = "https://connect.facebook.net/en_US/sdk.js";
//       script.async = true;
//       script.defer = true;
//       document.body.appendChild(script);
//     };

//     loadFacebookSDK();
//   }, []);

//   const loginWithFacebook = () => {
//     if (!window.FB) {
//       toast.error("Facebook SDK not loaded. Please try again.");
//       return;
//     }

//     window.FB.login(
//       (response) => {
//         if (response.authResponse) {
//           setAccessToken(response.authResponse.accessToken);
//           setUserID(response.authResponse.userID);
//           setExpiresIn(response.authResponse.expiresIn);
//           toast.success("Facebook login sucessful");
//         } else {
//           toast.error("Facebook login failed or was cancelled.");
//         }
//       },
//       { scope: "ads_management,ads_read,business_management,email,public_profile" }
//     );
//   };

//   return {
//     loginWithFacebook,
//     accessToken,
//     userID,
//     expiresIn,
//     isInitialized,
//   };
// };

// export default useFacebookAuth;
