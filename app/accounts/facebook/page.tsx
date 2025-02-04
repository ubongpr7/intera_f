"use client";
import env from "@/env_file";
const FACEBOOK_APP_ID = env.FACEBOOK_APP_ID;
const REDIRECT_URI = `${env.FRONTEND_HOST_URL}/accounts/facebook/`;
const handleFacebookLogin = () => {
  const oauthURL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=ads_read,pages_read_engagement,ads_management&response_type=code`;
  
  window.location.href = oauthURL; 
};

export default function SetupPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <button 
        onClick={handleFacebookLogin} 
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Setup with Facebook
      </button>
    </div>
  );
}
