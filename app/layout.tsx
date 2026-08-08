import "./globals.css";
import type { Metadata } from "next";
import StoreProvider from "../redux/provider";
import DashboardHeader from "../components/wrapper/dashboardHeader";
import NextTopLoader from 'nextjs-toploader';
import ThemeProvider from "@/components/theme-provider";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.interaims.com"),
  title: {
    default: "Intera IMS | Inventory operations made clearer",
    template: "%s | Intera IMS",
  },
  description:
    "Intera IMS helps businesses run clearer inventory operations with stock control, POS, purchasing, reporting, and AI assistance.",
  keywords: [
    "inventory management software",
    "inventory management system",
    "POS inventory software",
    "stock control software",
    "business intelligence for inventory",
    "offline POS",
    "Intera IMS",
    "InteraProTech",
  ],
  authors: [{ name: "InteraProTech" }],
  creator: "InteraProTech",
  publisher: "InteraProTech",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Intera IMS | Inventory operations made clearer",
    description:
      "Run inventory operations, POS, purchasing, reporting, and AI-assisted workflows in one workspace.",
    siteName: "Intera IMS",
    type: "website",
    locale: "en_NG",
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
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "InteraProTech",
      legalName: "InteraProTech Solutions",
      url: "https://www.interapro.tech",
      logo: "https://www.interaims.com/assets/interapro-gradient-dark.png",
      sameAs: [
        "https://www.linkedin.com/company/interapro-tech",
        "https://x.com/interaprotech",
        "https://www.facebook.com/interapro.tech",
        "https://www.instagram.com/interaprotech/",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Intera IMS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://www.interaims.com",
      image: "https://www.interaims.com/assets/interapro-gradient-dark.png",
      description: "An inventory operations platform for businesses that move stock, with inventory control, POS, purchasing, reporting, and AI-assisted workflows.",
      publisher: { "@type": "Organization", name: "InteraProTech", url: "https://www.interapro.tech" },
      featureList: [
        "Inventory control",
        "Point of sale operations",
        "Purchasing and receiving",
        "Business intelligence",
        "Operational accountability",
        "Offline-first workflows",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Intera IMS",
      url: "https://www.interaims.com",
      description: "Inventory operations software for businesses that move stock.",
    },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
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
