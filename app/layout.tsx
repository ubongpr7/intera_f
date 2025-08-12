import "./globals.css";
import type { Metadata } from "next";
import StoreProvider from "../redux/provider";
import DashboardHeader from "../components/wrapper/dashboardHeader";
import NextTopLoader from 'nextjs-toploader';
import ThemeProvider from "@/components/theme-provider";


export const metadata: Metadata = {
  title: "Intera Inventory",
  description: "AI-driven IMS",
  icons: {
    icon: ['/favicon.ico?v=4'],
    apple:['/apple-touch-icon.png?v=4'],
    shortcut:['/apple-touch-icon.png']
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
   

  return (
    <html lang="en" suppressHydrationWarning>
      
      <body className={`flex bg-gray-50 text-gray-900 w-full min-h-screen`} suppressHydrationWarning>
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

