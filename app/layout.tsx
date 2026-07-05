import "./globals.css";
import type { Metadata } from "next";
import StoreProvider from "../redux/provider";
import DashboardHeader from "../components/wrapper/dashboardHeader";
import NextTopLoader from 'nextjs-toploader';
import ThemeProvider from "@/components/theme-provider";


export const metadata: Metadata = {
  title: "Intera Inventory",
  description: "AI-driven IMS",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
   

  return (
    <html lang="en" suppressHydrationWarning>
      
      <body  suppressHydrationWarning>
      <NextTopLoader />
        <StoreProvider>
        <ThemeProvider>
        {children}
        </ThemeProvider>
        </StoreProvider>
        
      </body>
    </html>
  );
}
