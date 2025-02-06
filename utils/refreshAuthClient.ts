// app/TokenRefresh.tsx
'use client';

import { useEffect } from 'react';
import refreshUserToken  from './refreshAuth';

export default function TokenRefresh() {
  useEffect(() => {
    const interval = setInterval(refreshUserToken, 40 * 60 * 1000); // 40 minutes

    refreshUserToken();

    return () => clearInterval(interval);
  }, []);

  return null; 
}