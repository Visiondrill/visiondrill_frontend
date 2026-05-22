'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type AuthState = 'checking' | 'authorized' | 'redirecting';

/**
 * AdminLayout enforces that only authenticated users with the `admin` role can
 * see anything under /admin. The sibling student/instructor/business sections
 * rely on the api.ts axios interceptor redirecting on 401, which only fires
 * when a protected API call is made. /admin/page.tsx currently makes no API
 * call, so without this layout the route was reachable to anyone.
 *
 * The layout:
 *  - calls GET /me on mount,
 *  - redirects to /login if the call 401s (interceptor also handles this),
 *  - redirects to / if the user has no `admin` role,
 *  - only renders children once authorization is confirmed.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>('checking');

  useEffect(() => {
    let cancelled = false;
    api.get('/me')
      .then((res) => {
        if (cancelled) return;
        const roles: Array<{ name: string }> = res.data?.roles ?? [];
        const isAdmin = roles.some((r) => r?.name === 'admin');
        if (!isAdmin) {
          setState('redirecting');
          router.replace('/');
          return;
        }
        setState('authorized');
      })
      .catch(() => {
        if (cancelled) return;
        // The api.ts interceptor already redirects /admin on 401, but in case
        // the response is anything else (network error, CORS issue), bounce
        // explicitly to /login.
        setState('redirecting');
        router.replace('/login');
      });
    return () => { cancelled = true; };
  }, [router]);

  if (state !== 'authorized') {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <p className="text-sm font-bold text-gray-400 tracking-widest">VERIFYING ADMIN ACCESS…</p>
      </div>
    );
  }

  return <>{children}</>;
}
