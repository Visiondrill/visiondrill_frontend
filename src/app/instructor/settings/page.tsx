'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User, Mail, Shield, Zap, Save, Loader2, CheckCircle, Camera, Globe } from 'lucide-react';
import Button from '@/components/Button';

export default function InstructorSettings() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    short_description: '',
    long_description: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/me');
      setUser(res.data);
      setFormData({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        short_description: res.data.short_description || '',
        long_description: res.data.long_description || '',
      });
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/user/update-profile', formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">School settings</h1>
          <p className="text-gray-500 font-medium">Manage your professional instructor profile and account details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm text-center">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user?.first_name?.[0]}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-white border border-gray-100 rounded-xl text-blue-600 shadow-lg hover:bg-gray-50 transition-all">
                  <Camera size={16} />
                </button>
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tighter">{user?.fullname}</h3>
              <p className="text-xs font-semibold text-gray-400 mt-1">Instructor</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl shadow-xl shadow-blue-100 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl bg-white rounded-full -mr-10 -mt-10" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-blue-200" />
                  <span className="text-xs font-semibold text-blue-100">AI credits</span>
                </div>
                <div className="text-4xl font-black tracking-tighter mb-2">{user?.remaining_ai_tokens || 0}</div>
                <p className="text-xs text-blue-100 font-medium leading-relaxed opacity-80">
                  Tokens available for video transcriptions and AI-generated course content.
                </p>
                <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold transition-all">
                  Top up tokens
                </button>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-2">
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2 border-l-4 border-blue-600 pl-4">
                  <User size={18} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Personal information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">First name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={e => setFormData({...formData, first_name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none font-medium text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Last name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={e => setFormData({...formData, last_name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none font-medium text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input
                      type="email"
                      readOnly
                      value={formData.email}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2 border-l-4 border-purple-600 pl-4">
                  <Shield size={18} className="text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Instructor bio</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Short tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Architect with 10+ years exp"
                    value={formData.short_description}
                    onChange={e => setFormData({...formData, short_description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none font-medium text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Biography</label>
                  <textarea
                    rows={5}
                    value={formData.long_description}
                    onChange={e => setFormData({...formData, long_description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none font-medium text-sm transition-all resize-none"
                  />
                </div>
              </div>

              {/* External Integrations */}
              <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-8">
                <div className="flex items-center gap-2 mb-2 border-l-4 border-emerald-600 pl-4">
                  <Globe size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900">External Integrations</h3>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                         <Camera size={24} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-gray-900">Zoom Meetings</h4>
                         <p className="text-[10px] font-bold text-gray-400 tracking-tight mt-1">Host live sessions directly from your dashboard.</p>
                      </div>
                   </div>
                   <button 
                     type="button"
                     className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all shadow-lg shadow-blue-100 active:scale-95"
                   >
                      CONNECT ACCOUNT
                   </button>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 opacity-50 grayscale cursor-not-allowed">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                         <Mail size={24} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-gray-900">Google Calendar</h4>
                         <p className="text-[10px] font-bold text-gray-400 tracking-tight mt-1">Sync your teaching schedule with your calendar.</p>
                      </div>
                   </div>
                   <span className="px-4 py-2 bg-gray-200 text-gray-600 text-[10px] font-black rounded-lg">COMING SOON</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                    <CheckCircle size={18} /> Profile updated successfully!
                  </div>
                )}
                <div className="flex-grow" />
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-10 h-14 flex items-center gap-3 font-semibold text-sm shadow-xl shadow-blue-200"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
