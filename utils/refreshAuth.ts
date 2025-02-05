// 'use client'
// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import axios from 'axios';
// import { setCookie, getCookie } from 'cookies-next'; 
// import env from '@/env_file'; 

// const redirectToLogin = () => {
//   const router = useRouter();
//   setCookie('accessToken', '', { maxAge: -1 }); 
//   setCookie('refreshToken', '', { maxAge: -1 });
//   setCookie('user', '', { maxAge: -1 }); 

//   router.push('/accounts/login');
// };

// const refreshAccessToken = async () => {
//   const refreshToken = getCookie('refreshToken'); 

//   if (!refreshToken) {
//     redirectToLogin();
//     return;
//   }

//   try {
//     const response = await axios.post(`${env.BACKEND_HOST_URL}/jwt/refresh/`, { refresh: refreshToken });

//     if (response.data && response.data.access) {
//       // Set the new access token in cookies
//       setCookie('accessToken', response.data.access, { maxAge: 60 * 60 });  // 1 hour expiration
//       console.log('Access token refreshed');
//     } else {
//       redirectToLogin();
//     }
//   } catch (error) {
//     console.error('Refresh token request failed', error);
//     redirectToLogin();
//   }
// };

// // Custom hook to refresh the token periodically
// export const useTokenRefresh = () => {
//   const router = useRouter();

//   useEffect(() => {
//     // Check if the current route is protected (i.e., not starting with '/accounts')
//     if (!router.pathname.startsWith('/accounts')) {
//       // Refresh token every 15 minutes (or on initial load)
//       refreshAccessToken();

//       const intervalId = setInterval(() => {
//         refreshAccessToken();
//       }, 900000); // 15 minutes

//       // Cleanup the interval on unmount
//       return () => clearInterval(intervalId);
//     }
//   }, [router]);

//   return {
//     refreshAccessToken,
//   };
// };
