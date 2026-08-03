import "./globals.css";
import type { Metadata } from "next";
import StoreProvider from "../redux/provider";
import DashboardHeader from "../components/wrapper/dashboardHeader";
import NextTopLoader from 'nextjs-toploader';
import ThemeProvider from "@/components/theme-provider";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.interaims.com"),
  title: "Intera Inventory",
  description:
    "Intera IMS helps businesses run clearer inventory operations with stock control, POS, purchasing, reporting, and AI assistance.",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Intera IMS | Inventory operations made clearer",
    description:
      "Run inventory operations, POS, purchasing, reporting, and AI-assisted workflows in one workspace.",
    siteName: "Intera IMS",
    type: "website",
    images: [
      {
        url: "/assets/interapro-gradient-dark.png",
        width: 2000,
        height: 2000,
        alt: "InteraPro Tech Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intera IMS | Inventory operations made clearer",
    description:
      "Run inventory operations, POS, purchasing, reporting, and AI-assisted workflows in one workspace.",
    images: ["/assets/interapro-gradient-dark.png"],
  },
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
