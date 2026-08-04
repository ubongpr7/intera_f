"use client";

import Image from "next/image";
import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { SocialIcon } from "@/components/social-icons";

export function LandingFooter() {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const homepageLogoSrc = isDarkMode
    ? "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-WHITE-4.png"
    : "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-BLACK-3.png";

  return (
    <footer className="landing-footer border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 text-sm sm:px-6 lg:px-8">
        <div className="landing-footer-grid grid gap-10 border-b border-slate-800 pb-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="landing-footer-brand">
            <p className="landing-footer-kicker">Operations, in sync</p>
            <Image src={homepageLogoSrc} alt="Intera Inventory logo" width={320} height={96} sizes="(min-width: 1024px) 320px, 250px" className="landing-footer-logo mt-3 h-20 w-auto object-contain object-left sm:h-24" />
            <p className="mt-4 max-w-sm leading-6 text-slate-400">A command center for teams that need inventory, selling, and operational intelligence to move together.</p>
          </div>
          <div className="landing-footer-links text-base"><p className="font-semibold text-white">Explore</p><div className="mt-4 flex flex-col gap-3"><a href="/#capabilities">Capabilities</a><a href="/#demo">Live demo</a><Link href="/contact">Contact</Link><Link href="/privacy">Privacy Policy</Link></div></div>
          <div className="landing-footer-links text-base"><p className="font-semibold text-white">Account</p><div className="mt-4 flex flex-col gap-3"><Link href="/accounts">Start free</Link><Link href="/accounts/signin">Sign in</Link><a href="/#faq">FAQ</a><Link href="/terms">Terms and Conditions</Link></div></div>
          <div className="landing-footer-links text-base"><p className="font-semibold text-white">Connect</p><div className="landing-footer-socials mt-4 flex items-center gap-3"><a className="social-facebook" href="https://www.facebook.com/interapro.tech" target="_blank" rel="noopener noreferrer" aria-label="InteraPro on Facebook" title="Facebook"><SocialIcon name="facebook" size={22} /></a><a className="social-x" href="https://x.com/interaprotech" target="_blank" rel="noopener noreferrer" aria-label="InteraPro on X" title="X"><SocialIcon name="x" size={22} /></a><a className="social-instagram" href="https://www.instagram.com/interaprotech/" target="_blank" rel="noopener noreferrer" aria-label="InteraPro on Instagram" title="Instagram"><SocialIcon name="instagram" size={22} /></a><a className="social-linkedin" href="https://www.linkedin.com/company/interapro-tech" target="_blank" rel="noopener noreferrer" aria-label="InteraPro on LinkedIn" title="LinkedIn"><SocialIcon name="linkedin" size={22} /></a><a className="social-whatsapp" href="https://wa.me/message/ATQVXMZQ4MLDI1" target="_blank" rel="noopener noreferrer" aria-label="Contact Intera on WhatsApp" title="WhatsApp"><SocialIcon name="whatsapp" size={22} /></a><a className="social-phone" href="tel:+2347042042034" aria-label="Call Intera" title="Call Intera"><PhoneCall className="h-[22px] w-[22px]" /></a></div></div>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Intera Inventory. Built for dependable operations.</p><p>Inventory clarity, from first scan to final decision.</p></div>
      </div>
    </footer>
  );
}
