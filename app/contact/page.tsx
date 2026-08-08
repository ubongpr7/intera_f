import Link from "next/link";
import { ArrowLeft, Mail, MapPin, PhoneCall } from "lucide-react";
import { ContactForm } from "@/components/landing/contact-form";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

export const metadata = {
  title: "Contact | Intera IMS",
  description: "Contact the Intera team about inventory operations, POS, and business intelligence.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Intera IMS",
    description: "Talk to the Intera team about inventory operations, POS, and business intelligence.",
    url: "https://www.interaims.com/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="landing-page min-h-screen">
      <LandingHeader />
      <main className="landing-hero min-h-screen text-gray-950 dark:text-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4" /> Back to Intera IMS
        </Link>
        <div className="mt-12 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <section>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700 dark:text-blue-300">Start a conversation</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Talk to the Intera team.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">Tell us about your business, your inventory operation, or the challenge you want to solve. We will respond with the most relevant next step.</p>
            <div className="mt-8 grid gap-4 text-sm text-gray-600 dark:text-gray-300">
              <a className="inline-flex items-center gap-3 hover:text-blue-700 dark:hover:text-blue-300" href="mailto:business@interapro.tech"><Mail className="h-5 w-5 text-blue-600 dark:text-blue-300" /> business@interapro.tech</a>
              <a className="inline-flex items-center gap-3 hover:text-blue-700 dark:hover:text-blue-300" href="tel:+2347042042034"><PhoneCall className="h-5 w-5 text-blue-600 dark:text-blue-300" /> Call the Intera team</a>
              <span className="inline-flex items-center gap-3"><MapPin className="h-5 w-5 text-blue-600 dark:text-blue-300" /> Ikorodu, Lagos, Nigeria</span>
            </div>
          </section>
          <ContactForm />
        </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
