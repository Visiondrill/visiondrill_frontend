'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getCsrfCookie } from '@/lib/api';
import { Mail, Lock, User, ArrowLeft, CheckCircle2, BookOpen, Briefcase } from 'lucide-react';

// Next.js requires components that call useSearchParams to be inside a
// Suspense boundary so the build can pre-render the page shell without
// the URL params. Without this wrapper, `next build` fails with a
// "missing-suspense-with-csr-bailout" prerender error.
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-bold text-gray-400">Loading…</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const roleType = searchParams.get('type') || 'student';
  const isInstructor = roleType === 'instructor';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: isInstructor ? 'author' : 'student'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anti-Robot Math Captcha
  const [mathTask, setMathTask] = useState({ num1: 0, num2: 0 });
  const [mathAnswer, setMathAnswer] = useState('');

  useEffect(() => {
    setMathTask({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1
    });
  }, []);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (parseInt(mathAnswer) !== (mathTask.num1 + mathTask.num2)) {
      setError('Human verification failed.');
      setIsLoading(false);
      setMathTask({
        num1: Math.floor(Math.random() * 10) + 1,
        num2: Math.floor(Math.random() * 10) + 1
      });
      setMathAnswer('');
      return;
    }

    try {
      await getCsrfCookie();
      const response = await api.post('/register', { ...formData, password_confirmation: formData.password });
      if (response.status === 201 || response.status === 200) {
        const user = response.data?.user;
        const roleNames = (user?.roles || []).map((r: any) => r.name);

        if (roleNames.includes('admin')) router.push('/admin');
        else if (roleNames.includes('business')) router.push('/business');
        else if (roleNames.includes('author')) router.push('/instructor');
        else router.push('/student');
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans flex overflow-hidden">
      {/* Left Decoration */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-950 relative items-center justify-center p-24 overflow-hidden transition-colors duration-700">
        <div className="absolute top-0 right-0 w-[800px] h-full bg-[radial-gradient(circle_at_100%_0%,rgba(0,86,210,0.05),transparent)]"></div>
        <div className="relative z-10 text-white">
           <Link href="/" className="inline-flex items-center gap-3 mb-12 hover:scale-105 transition-transform">
              <img src="/images/visiondrill-logo-icon.png" alt="VisionDrill" className="w-10 h-10 object-contain bg-white rounded-xl p-2 shadow-2xl" />
              <div className="flex flex-col">
                 <span className="text-2xl font-black tracking-tighter">Visiondrill</span>
                 <span className="text-[9px] font-black  tracking-widest text-blue-400 opacity-60">
                    {isInstructor ? 'Instructor core' : 'Student core'}
                 </span>
              </div>
           </Link>
           <h1 className="text-5xl font-black leading-[0.95] tracking-tight mb-6">
             {isInstructor ? 'Forge your' : 'Begin your'} <br />
             <span className="italic text-blue-400 flex items-center gap-4">
                {isInstructor ? 'Studio' : 'Academy'} 
                <div className="h-px w-16 bg-blue-500/30"></div>
             </span>
           </h1>
           
           <div className="space-y-4 mt-12">
              {(isInstructor ? [
                "Reach 15,000+ global learners",
                "Advanced AI architect tools"
              ] : [
                "Verified professional courses",
                "Personalized learning paths"
              ]).map((text, i) => (
                <div key={i} className="flex items-center gap-4 text-blue-100/50 font-bold text-[9px]  tracking-widest">
                   <CheckCircle2 size={14} className="text-blue-400" /> {text}
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Right Register Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <Link href="/login" className="absolute top-10 left-10 flex items-center text-[9px] font-black text-gray-400 hover:text-blue-600 transition-colors group  tracking-widest">
           <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Sign in
        </Link>

        <div className="max-w-md w-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="mb-10">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-8">
               {isInstructor ? <Briefcase size={20} /> : <BookOpen size={20} />}
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">
               {isInstructor ? 'Mentor registration' : 'Account creation'}
            </h2>
            <p className="text-gray-400 font-medium italic text-xs">Credential initialization.</p>
          </div>

          <form className="space-y-3" onSubmit={handleRegister}>
            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 text-[9px] font-bold border border-red-100 animate-shake">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 mb-1.5 transition-colors group-focus-within:text-blue-600  tracking-widest">First name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                    placeholder="Name"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 mb-1.5 transition-colors group-focus-within:text-blue-600  tracking-widest">Last name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                    placeholder="Surname"
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] font-black text-gray-400 mb-1.5 transition-colors group-focus-within:text-blue-600  tracking-widest">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                  <Mail size={14} />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] font-black text-gray-400 mb-1.5 transition-colors group-focus-within:text-blue-600  tracking-widest">Secure password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Anti-Robot Verification */}
            <div className="group pt-1">
              <label className="block text-[9px] font-black text-gray-400 mb-1.5 transition-colors group-focus-within:text-blue-600  tracking-widest">
                Verification: {mathTask.num1} + {mathTask.num2} = ?
              </label>
              <input
                type="number"
                required
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                placeholder="Sum..."
              />
            </div>

            <p className="text-[8px] font-bold text-gray-400 text-center py-2  tracking-widest">
               By joining, you agree to our <span className="text-gray-900">Terms</span> and <span className="text-gray-900">Privacy</span>.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-950 text-white font-black rounded-lg hover:bg-black transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-2 text-[10px]  tracking-widest"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>{isInstructor ? 'Activate core' : 'Create profile'} <ArrowLeft className="rotate-180" size={14} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
