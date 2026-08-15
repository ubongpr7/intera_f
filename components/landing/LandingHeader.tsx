"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LogIn, Moon, Menu, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setIsDarkMode } from "@/redux/state";

export function LandingHeader() {
  const waitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE?.trim().toLowerCase() === "true";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const dispatch = useAppDispatch();
  const homepageLogoSrc = isDarkMode
    ? "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-WHITE-4.png"
    : "/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-BLACK-3.png";

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !mobileMenuRef.current?.contains(target) && !target.closest(".landing-menu-trigger")) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [isMobileMenuOpen]);

  const toggleLandingTheme = () => dispatch(setIsDarkMode(!isDarkMode));

  return (
    <header className="landing-header sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative block h-12 w-[172px] shrink-0 overflow-hidden sm:h-14 sm:w-[196px]">
            <Image src={homepageLogoSrc} alt="Intera Inventory logo" fill priority sizes="(min-width: 1024px) 196px, 172px" className="object-cover object-center" />
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="/#capabilities" className="text-sm text-gray-600 md:text-base hover:text-gray-900">Capabilities</a>
          <a href="/#demo" className="text-sm text-gray-600 md:text-base hover:text-gray-900">Demo</a>
          <a href="/#faq" className="text-sm text-gray-600 md:text-base hover:text-gray-900">FAQ</a>
          <Link href="/contact" className="text-sm text-gray-600 md:text-base hover:text-gray-900">Contact</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <button type="button" onClick={toggleLandingTheme} className="landing-theme-toggle" aria-label={`Switch to ${isDarkMode ? "light" : "dark"} theme`}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {waitlistMode ? <a href="#waitlist" className="text-sm font-semibold text-blue-700">Launch date to be announced</a> : <>
            <Button variant="secondary" asChild><Link className="landing-nav-secondary" href="/accounts/signin"><LogIn className="h-4 w-4" />Sign in</Link></Button>
            <Button asChild><Link className="landing-nav-primary" href="/accounts">Get started <ArrowRight className="h-4 w-4" /></Link></Button>
          </>}
        </div>
        <button type="button" className="landing-menu-trigger inline-flex md:hidden" onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)} aria-label="Toggle menu" aria-expanded={isMobileMenuOpen} aria-controls="landing-mobile-menu">
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div ref={mobileMenuRef} id="landing-mobile-menu" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.18, ease: "easeOut" }} className="landing-mobile-menu md:hidden">
            <div className="landing-mobile-links">
              <a href="/#capabilities" onClick={() => setIsMobileMenuOpen(false)}>Capabilities <ArrowRight className="h-4 w-4" /></a>
              <a href="/#demo" onClick={() => setIsMobileMenuOpen(false)}>Demo <ArrowRight className="h-4 w-4" /></a>
              <a href="/#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ <ArrowRight className="h-4 w-4" /></a>
              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="landing-mobile-actions">
              <button type="button" onClick={toggleLandingTheme} className="landing-theme-toggle" aria-label={`Switch to ${isDarkMode ? "light" : "dark"} theme`}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {waitlistMode ? <a href="#waitlist" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center text-sm font-semibold text-blue-700">Launch date to be announced</a> : <>
                <Button variant="ghost" asChild className="flex-1"><Link className="landing-nav-secondary" href="/accounts/signin" onClick={() => setIsMobileMenuOpen(false)}><LogIn className="h-4 w-4" />Sign in</Link></Button>
                <Button asChild className="flex-1"><Link className="landing-nav-primary" href="/accounts" onClick={() => setIsMobileMenuOpen(false)}>Get started <ArrowRight className="h-4 w-4" /></Link></Button>
              </>}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
