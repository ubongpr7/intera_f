import { useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import env from '@/env_file'; // Make sure env variables are set correctly

const redirectToLogin = () => {
  const router = useRouter();
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  router.push("/accounts/login");
};
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    redirectToLogin();
    return;
  }

  try {
    const response = await axios.post(`${env.BACKEND_HOST_URL}/jwt/refresh/`, { refresh: refreshToken });

    if (response.data && response.data.access) {
      localStorage.setItem("accessToken", response.data.access);
      console.log('Access token refreshed');
    } else {
      redirectToLogin();
    }
  } catch (error) {
    console.error('Refresh token request failed', error);
    redirectToLogin();
  }
};

// This is a custom hook to refresh the token periodically
export const useTokenRefresh = () => {
  const router = useRouter();

  useEffect(() => {
    // Set interval for token refresh (e.g., every 15 minutes)
    const intervalId = setInterval(() => {
      refreshAccessToken();
    }, 900000); // 15 minutes

    // Cleanup the interval on unmount
    return () => clearInterval(intervalId);
  }, [router]);

  return {
    refreshAccessToken,
  };
};
