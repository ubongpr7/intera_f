import env from '@/env_file';
import { setCookie, getCookie } from 'cookies-next';
import { useRouter } from 'next/router';

const refreshUserToken = async () => {
  const router = useRouter();
  const refreshToken = getCookie('refreshToken');

  if (!refreshToken) {
    if (!router.pathname.startsWith('/accounts') && router.pathname !== '/') {
      router.push(`/accounts/login?next=${encodeURIComponent(router.asPath)}`);
    }
    return;
  }

  try {
    const response = await fetch(`${env.BACKEND_HOST_URL}/jwt/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      setCookie('accessToken', data.access, { maxAge: 50 * 60 }); 
      setCookie('refreshToken', data.refresh, { maxAge: 10 * 24 * 60 * 60 });
    } else {
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Redirect to login if token refresh fails
    if (!router.pathname.startsWith('/accounts') && router.pathname !== '/') {
      router.push(`/accounts/login?next=${encodeURIComponent(router.asPath)}`);
    }
  }
};

export default refreshUserToken;