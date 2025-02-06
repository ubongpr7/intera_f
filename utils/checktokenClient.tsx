// app/AuthChecker.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface AuthCheckerProps {
  accessToken?: string;
  refreshToken?: string;
}

export default function AuthChecker({ accessToken, refreshToken }: AuthCheckerProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!accessToken && !refreshToken && !pathname.startsWith('/accounts') && pathname !== '/') {
      router.push(`/accounts/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, refreshToken, pathname, router]);

  return null; // This component doesn't render anything
}