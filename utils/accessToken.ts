"use client";

import env from "@/env_file";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useCreateAdAccountMutation } from "@/redux/features/adAccountApiSlice";

const FACEBOOK_APP_ID = env.FACEBOOK_APP_ID;

const useFacebookAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
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

  const fetchFacebookData = async (token: string) => {
    try {
      const fields = "id,name,adaccounts{id,name,account_id},businesses{id,name},pixel_id";
      const response = await fetch(`https://graph.facebook.com/v20.0/me?fields=${fields}&access_token=${token}`);
      const data = await response.json();

      if (!data.id) {
        throw new Error("Failed to fetch Facebook data");
      }

      const adAccounts = data.adaccounts?.data?.[0] || {};
      const business = data.businesses?.data?.[0] || {};

      // Construct payload
      const adAccountData = {
        ad_account_id: adAccounts.account_id || null,
        name: adAccounts.name || null,
        business_manager_id: business.id || null,
        pixel_id: data.pixel_id || null,
        facebook_page_id: data.id, 
        access_token: token,
        is_bound: true,
      };

      // Send data to backend
      await createAdAccount(adAccountData).unwrap();
      toast.success("Ad account successfully created!");
    } catch (error: any) {
      console.error("Error fetching Facebook data:", error);
      toast.error("Failed to fetch Facebook data.");
    }
  };

  const loginWithFacebook = () => {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded. Please try again.");
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const { accessToken, userID, expiresIn } = response.authResponse;
          setAccessToken(accessToken);
          setUserID(userID);
          setExpiresIn(expiresIn);

          fetchFacebookData(accessToken);
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


// "use client";

// import env from "@/env_file";
// import { useState, useEffect } from "react";
// import { toast } from "react-toastify";

// const FACEBOOK_APP_ID =env.FACEBOOK_APP_ID;

// const useFacebookAuth = () => {
//   const [accessToken, setAccessToken] = useState<string | null>(null);
//   const [userID, setUserID] = useState<string | null>(null);
//   const [expiresIn, setExpiresIn] = useState<number | null>(null);
//   const [isInitialized, setIsInitialized] = useState(false);

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

