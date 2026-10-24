'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const COOKIE_CONSENT_KEY = 'intera_cookie_consent_v1';

type CookieConsentContextValue = {
  hasConsented: boolean;
  acceptCookies: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsented, setHasConsented] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setHasConsented(window.localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted');
    setHasLoaded(true);
  }, []);

  const value = useMemo<CookieConsentContextValue>(() => ({
    hasConsented: hasLoaded && hasConsented,
    acceptCookies: () => {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      setHasConsented(true);
      setHasLoaded(true);
    },
  }), [hasConsented, hasLoaded]);

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used inside CookieConsentProvider');
  }
  return context;
}

export function CookieConsentNotice() {
  const { hasConsented, acceptCookies } = useCookieConsent();
  const pathname = usePathname();
  const isAuthEntryPath = pathname === '/accounts' || pathname === '/accounts/signin';

  if (hasConsented || !isAuthEntryPath) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 p-4 shadow-[0_-12px_40px_rgba(15,23,42,0.16)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/95 sm:p-5">
      <section
        role="region"
        aria-labelledby="cookie-consent-title"
        className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-slate-900 sm:flex-row sm:items-center sm:justify-between dark:text-white"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Before you continue</p>
          <h2 id="cookie-consent-title" className="mt-1 text-base font-semibold">Cookies and local storage</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Intera IMS uses essential browser storage and cookies to keep you signed in, protect your session, remember workspace context, and keep the application secure. You must agree before signing in or creating an account.
            {' '}
            Read our <Link href="/privacy" className="font-medium text-blue-600 underline underline-offset-2 dark:text-blue-300">Privacy Policy</Link>.
          </p>
        </div>
        <button
          type="button"
          onClick={acceptCookies}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
        >
          Agree and continue
        </button>
      </section>
    </div>
  );
}
