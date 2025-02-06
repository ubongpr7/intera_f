// // components/TokenRefresher.tsx
// 'use client';

// import { useEffect } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { getCookie } from 'cookies-next';
// import { refreshUserToken } from './refreshAuth';

// export default function TokenRefresher() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const refreshToken = getCookie('refreshToken');

//   useEffect(() => {
//     const refresh = async () => {
//       await refreshUserToken(refreshToken, pathname, router);
//     };

//     refresh();

//     const interval = setInterval(refresh, 40 * 60 * 1000); // 40 minutes

//     return () => clearInterval(interval);
//   }, [refreshToken, pathname, router]);

//   return null; 
// }