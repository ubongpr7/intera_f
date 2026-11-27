"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";

type ServiceAwareLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  fallbackHref?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

const DEMO_FALLBACK = "/#waitlist";

export function ServiceAwareLink({
  children,
  fallbackHref = DEMO_FALLBACK,
  onClick,
  ...linkProps
}: ServiceAwareLinkProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (isChecking) return;
    setIsChecking(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch("/api/public/auth-availability", {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = (await response.json()) as { available?: boolean };
      const destination = response.ok && result.available ? linkProps.href : fallbackHref;
      router.push(typeof destination === "string" ? destination : fallbackHref);
    } catch {
      router.push(fallbackHref);
    } finally {
      window.clearTimeout(timeout);
      setIsChecking(false);
    }
  }

  return (
    <Link
      {...linkProps}
      onClick={handleClick}
      aria-busy={isChecking || undefined}
    >
      {children}
    </Link>
  );
}
