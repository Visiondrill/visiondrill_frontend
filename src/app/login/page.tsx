'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api, getCsrfCookie, getErrorMessage } from '@/lib/api';
import { Mail, Lock, ArrowLeft, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await getCsrfCookie();
      const response = await api.post('/login', { email, password });
      
      if (response.status === 200) {
        const user = response.data.user;
        const roleNames = (user.roles || []).map((r: any) => r.name);

        if (roleNames.includes('admin')) window.location.href = '/admin';
        else if (roleNames.includes('business')) window.location.href = '/business';
        else if (roleNames.includes('author')) window.location.href = '/instructor';
        else window.location.href = '/student';
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans flex overflow-hidden">
      {/* Left Decoration */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-950 relative items-center justify-center p-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-full bg-[radial-gradient(circle_at_100%_0%,rgba(0,86,210,0.05),transparent)]"></div>
        <div className="relative z-10 text-white">
           <Link href="/" className="inline-flex items-center gap-3 mb-12 hover:scale-105 transition-transform">
              <img src="/images/visiondrill-logo-icon.png" alt="VisionDrill" className="w-10 h-10 object-contain bg-white rounded-xl p-2 shadow-2xl" />
              <span className="text-2xl font-black tracking-tighter">Visiondrill</span>
           </Link>
           <h1 className="text-5xl font-black leading-[0.95] tracking-tight mb-6">
             Access your <br />
             <span className="italic text-blue-400 flex items-center gap-4">Potential <div className="h-px w-16 bg-blue-500/30"></div></span>
           </h1>
           <p className="text-base text-blue-100/60 font-medium leading-relaxed max-w-sm">
             Join thousands of professionals mastering the skills that shape the future.
           </p>
           
           <div className="mt-12 grid grid-cols-2 gap-3 max-w-lg">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                 <Zap className="text-blue-400 mb-3" size={16} />
                 <p className="text-[9px] font-black  text-blue-200">Market ready</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                 <Zap className="text-blue-400 mb-3" size={16} />
                 <p className="text-[9px] font-black  text-blue-200">Expert led</p>
              </div>
           </div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <Link href="/" className="absolute top-10 left-10 flex items-center text-[9px] font-black text-gray-400 hover:text-blue-600 transition-colors group  tracking-widest">
           <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back home
        </Link>

        <div className="max-w-md w-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Sign in</h2>
            <p className="text-gray-400 font-medium italic text-xs">Command console access.</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-[9px] font-bold border border-red-100 animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 mb-2 transition-colors group-focus-within:text-blue-600  tracking-widest">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-end mb-2">
                   <label className="block text-[9px] font-black text-gray-400 transition-colors group-focus-within:text-blue-600  tracking-widest">Password</label>
                   <Link href="/forgot-password" title="Forgot Password" className="text-[9px] font-black text-blue-600  tracking-widest">Forgot?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300">
                    <Lock size={14} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-50 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-[10px] font-bold text-gray-400 cursor-pointer  tracking-widest">
                Remember
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-950 text-white font-black rounded-lg hover:bg-black transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-2 text-[10px]  tracking-widest"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>Sign in <ArrowLeft className="rotate-180" size={14} /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
             <p className="text-gray-400 font-medium text-[10px]  tracking-widest">
                New to Visiondrill?{' '}
                <Link href="/register" className="text-blue-600 font-black hover:underline underline-offset-4">
                  Register
                </Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
