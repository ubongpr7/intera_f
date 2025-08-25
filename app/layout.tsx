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
    icon: ['https://interabucket.s3.amazonaws.com/attachments/product/light_intera-202508252032.png'],
    apple:['https://interabucket.s3.amazonaws.com/attachments/product/light_intera-202508252032.png'],
    shortcut:['https://interabucket.s3.amazonaws.com/attachments/product/light_intera-202508252032.png']
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

