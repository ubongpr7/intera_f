// // import { NextResponse } from 'next/server';
// // import { cookies } from 'next/headers';
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// // // Middleware function to protect pages
// // export function middleware(request) {
// //   const token = cookies().get("accessToken");  // Check if accessToken exists in cookies
// //   const url = request.url;

// //   // Allow access to accounts or home page
// //   if (url.includes('/accounts') || url === '/') {
// //     return NextResponse.next();  // Allow the request to proceed
// //   }

// //   // If accessToken is missing, redirect to login page
// //   if (!token) {
// //     return NextResponse.redirect(new URL('/accounts/login', request.url));
// //   }

// //   // Otherwise, allow the request to proceed
// //   return NextResponse.next();
// // }

// // // Define which routes the middleware should apply to
// // export const config = {
// //   matcher: ['/((?!accounts|_next|favicon.ico).*)'],  // Apply middleware to all routes except /accounts and static assets
// // };
