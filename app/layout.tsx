import "./globals.css";
import type { Metadata } from "next";
import StoreProvider from "../redux/provider";
import DashboardHeader from "../components/wrapper/dashboardHeader";
import NextTopLoader from 'nextjs-toploader';
import ThemeProvider from "@/components/theme-provider";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";


export const metadata: Metadata = {
  title: "Intera Inventory",
  description: "AI-driven IMS",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/assets/img/favicons/favicon-light.png",
        type: "image/png",
        sizes: "2000x2000",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/assets/img/favicons/favicon-dark.png",
        type: "image/png",
        sizes: "2000x2000",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() ?? "";

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextTopLoader />
        <StoreProvider>
          <ThemeProvider>
            <MicrosoftClarity projectId={clarityProjectId} />
            {children}
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
