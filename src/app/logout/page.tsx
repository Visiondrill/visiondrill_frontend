'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // The global api interceptor in lib/api.ts will handle 419 retries automatically
        await api.post('/logout');
      } catch (err) {
        console.error('Logout request failed:', err);
      } finally {
        // Always clear state and redirect regardless of server response
        localStorage.removeItem('token'); 
        router.push('/login');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-bold text-gray-400  tracking-widest">Terminating session...</p>
    </div>
  );
}
