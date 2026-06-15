'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api, getCsrfCookie, getErrorMessage } from '@/lib/api';
import { Mail, Lock, ArrowLeft, CheckCircle, Loader2, KeyRound, Shield } from 'lucide-react';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await getCsrfCookie();
      const res = await api.post('/forgot-password', { email });
      setDevOtp(res.data?.otp || null);
      setSuccess(res.data.message || 'A verification code has been sent.');
      setStep('otp');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await getCsrfCookie();
      const res = await api.post('/verify-reset-otp', { email, otp });
      setResetToken(res.data.reset_token);
      setSuccess('Code verified. Set your new password.');
      setStep('reset');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await getCsrfCookie();
      await api.post('/reset-password', {
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess('Password has been reset successfully. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await getCsrfCookie();
      const res = await api.post('/forgot-password', { email });
      setDevOtp(res.data?.otp || null);
      setSuccess('A new verification code has been sent.');
    } catch (err) {
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
            Reset your <br />
            <span className="italic text-blue-400 flex items-center gap-4">Password <div className="h-px w-16 bg-blue-500/30"></div></span>
          </h1>
          <p className="text-base text-blue-100/60 font-medium leading-relaxed max-w-sm">
            {step === 'email' && 'Enter your registered email to receive a verification code.'}
            {step === 'otp' && 'Enter the 6-digit code sent to your email.'}
            {step === 'reset' && 'Choose a strong new password for your account.'}
          </p>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <Link href="/login" className="absolute top-10 left-10 flex items-center text-[9px] font-black text-gray-400 hover:text-blue-600 transition-colors group tracking-widest">
          <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to login
        </Link>

        <div className="max-w-md w-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Forgot password</h2>
            <p className="text-gray-400 font-medium italic text-xs">
              {step === 'email' && 'Step 1: Verify your email'}
              {step === 'otp' && 'Step 2: Enter verification code'}
              {step === 'reset' && 'Step 3: Set new password'}
            </p>
          </div>

          {/* Step 1: Email */}
          {step === 'email' && (
            <form className="space-y-4" onSubmit={handleSendOtp}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-[9px] font-bold border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100">
                  {success}
                </div>
              )}
              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 mb-2 tracking-widest">Email address</label>
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
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-950 text-white font-black rounded-lg hover:bg-black transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-2 text-[10px] tracking-widest"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <>Send Code <ArrowLeft className="rotate-180" size={14} /></>}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-[9px] font-bold border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100">
                  {success}
                </div>
              )}
              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 mb-2 tracking-widest">Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300">
                    <Shield size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px] tracking-[0.3em] text-center"
                    placeholder="000000"
                  />
                </div>
              </div>
              {devOtp && (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100 text-center">
                  🛠 DEV MODE: Your OTP is <span className="font-black tracking-widest">{devOtp}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full h-12 bg-blue-950 text-white font-black rounded-lg hover:bg-black transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-2 text-[10px] tracking-widest disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <>Verify Code <CheckCircle size={14} /></>}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="w-full py-3 text-[9px] font-black text-gray-400 hover:text-blue-600 tracking-widest transition-colors"
              >
                Resend code
              </button>
            </form>
          )}

          {/* Step 3: Set New Password */}
          {step === 'reset' && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-[9px] font-bold border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100">
                  {success}
                </div>
              )}
              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 mb-2 tracking-widest">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300">
                    <Lock size={14} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-[9px] font-black text-gray-400 mb-2 tracking-widest">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300">
                    <KeyRound size={14} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="block w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-100 transition-all outline-none text-gray-900 font-bold placeholder-gray-300 text-[11px]"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || password.length < 8}
                className="w-full h-12 bg-blue-950 text-white font-black rounded-lg hover:bg-black transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-2 text-[10px] tracking-widest disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <>Reset Password <CheckCircle size={14} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}