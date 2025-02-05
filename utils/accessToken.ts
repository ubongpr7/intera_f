"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import env from "@/env_file";
const FACEBOOK_APP_ID = env.FACEBOOK_APP_ID
import { useCreateAdAccountMutation } from "@/redux/features/adAccountApiSlice";
const useFacebookAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [createAdAccount, { isLoading }] = useCreateAdAccountMutation();

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
      (response: any) => {
        if (response.authResponse) {
          const { accessToken, userID } = response.authResponse;
          setAccessToken(accessToken);
          setUserID(userID);
        } else {
          toast.error("Facebook login failed or was cancelled.");
        }
      },
      { scope: "ads_management,ads_read,business_management,email,public_profile" }
    );
  };

  useEffect(() => {
    if (accessToken && userID) {
        try{
            createAdAccount(accessToken, userID);
            toast.success(' Facebook Token Added')
        }
        catch(error){
            console.log(error)
        }
    }
  }, [accessToken, userID]);

  return {
    loginWithFacebook,
    accessToken,
    userID,
    isInitialized,
  };
};

export default useFacebookAuth;


// "use client"; // Ensures client-side execution in Next.js

// import { useState, useEffect } from "react";
// import { toast } from "react-toastify";

// const FacebookLogin = () => {
//   const [accessToken, setAccessToken] = useState<string | null>(null);
//   const [userID, setUserID] = useState<string | null>(null);

//   useEffect(() => {
//     const loadFacebookSDK = () => {
//       if (window.FB) return; // Prevent multiple loads

//       window.fbAsyncInit = function () {
//         window.FB.init({
//           appId: "FACEBOOK_APP_ID", 
//           cookie: true,
//           xfbml: true,
//           version: "v20.0",
//         });
//       };

//       const script = document.createElement("script");
//       script.src = "https://connect.facebook.net/en_US/sdk.js";
//       script.async = true;
//       script.defer = true;
//       document.body.appendChild(script);
//     };

//     loadFacebookSDK();
//   }, []);

//   const handleFacebookLogin = () => {
//     if (!window.FB) {
//       toast.error("Facebook SDK not loaded. Please try again.");
//       return;
//     }

//     window.FB.login(
//       (response: any) => {
//         if (response.authResponse) {
//           const { accessToken, userID } = response.authResponse;
//           setAccessToken(accessToken);
//           setUserID(userID);
//           console.log("Facebook Access Token:", accessToken);
//           console.log("Facebook User ID:", userID);
//         } else {
//           toast.error("Facebook login failed or was cancelled.");
//         }
//       },
//       { scope: "ads_management,ads_read,business_management,email,public_profile" }
//     );
//   };
//   useEffect(() => {
//     if (accessToken && userID) {
//       CreateAdAccountComponent(accessToken, userID);
//     }
//   }, [accessToken, userID]);


//   return (
//     <div>
//       <button onClick={handleFacebookLogin}>Login with Facebook</button>
//       {accessToken && (
//         <div>
//           <p><strong>Access Token:</strong> {accessToken}</p>
//           <p><strong>User ID:</strong> {userID}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FacebookLogin;
