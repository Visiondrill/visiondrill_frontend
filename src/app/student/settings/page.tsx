'use client';

import React, { useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { User, Lock, Mail, Phone, Camera, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar: null
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  const fetchUser = async () => {
    try {
      const res = await api.get('/me');
      if (res.data) {
        setProfile({
          ...res.data,
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          phone: res.data.contact_number || res.data.phone || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    setIsSaving(true);
    try {
      const res = await api.post('/profile/update', data);
      setProfile({
        ...profile,
        ...res.data.user
      });
      toast.success('Avatar updated successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch('/profile/update', profile);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.new_password_confirmation) {
      toast.error('Passwords do not match!');
      return;
    }
    
    setIsSaving(true);
    try {
      await api.patch('/profile/security', passwords);
      toast.success('Password securely updated.');
      setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-gray-500 font-medium">Loading profile...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize mb-2">Account Settings</h1>
          <p className="text-gray-500 font-medium">Manage your personal information and platform security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Col - Avatar & Summary */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-6" onClick={handleAvatarClick}>
                 <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-blue-100 overflow-hidden relative">
                    {profile.picture ? (
                       <img src={profile.picture} alt="Avatar" className="w-full h-full object-cover" />
                    ) : profile.first_name ? (
                       profile.first_name[0]
                    ) : (
                       <User size={48} className="text-white/50" />
                    )}
                 </div>
                 <div className="absolute inset-0 bg-blue-600/90 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Camera size={24} className="mb-2" />
                    <span className="text-xs font-bold capitalize">Update</span>
                 </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*"
              />
              <h3 className="text-xl font-black text-gray-900 capitalize tracking-tight mb-1">
                 {profile.first_name} {profile.last_name}
              </h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold mb-6">
                 <ShieldCheck size={14} /> Student Account
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                 Your avatar and profile are visible to instructors when you submit assignments or participate in Q&A.
              </p>
           </div>
        </div>

        {/* Right Col - Forms */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* General Info */}
           <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm">
              <h4 className="text-lg font-black text-gray-900 capitalize tracking-tight mb-6 flex items-center gap-3">
                 <User size={20} className="text-blue-600" /> Personal Identity
              </h4>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 capitalize">First Name</label>
                       <input 
                         type="text" 
                         value={profile.first_name}
                         onChange={e => setProfile({...profile, first_name: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 capitalize">Last Name</label>
                       <input 
                         type="text" 
                         value={profile.last_name}
                         onChange={e => setProfile({...profile, last_name: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 capitalize">Email Address</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="email" 
                            disabled
                            value={profile.email}
                            className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-500 font-medium outline-none cursor-not-allowed"
                          />
                       </div>
                       <p className="text-xs text-gray-400 font-bold tracking-wide">Email cannot be changed directly.</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 capitalize">Phone Number</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="tel" 
                            value={profile.phone}
                            onChange={e => setProfile({...profile, phone: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button 
                       type="submit"
                       disabled={isSaving}
                       className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl capitalize shadow-xl shadow-blue-100 transition-all active:scale-95"
                    >
                       <Save size={18} /> {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                 </div>
              </form>
           </div>

           {/* Security / Password */}
           <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm">
              <h4 className="text-lg font-black text-gray-900 capitalize tracking-tight mb-6 flex items-center gap-3">
                 <Lock size={20} className="text-blue-600" /> Security & Authentication
              </h4>
              
              <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-500 capitalize">Current Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwords.current_password}
                      onChange={e => setPasswords({...passwords, current_password: e.target.value})}
                      className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 capitalize">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwords.new_password}
                      onChange={e => setPasswords({...passwords, new_password: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 capitalize">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwords.new_password_confirmation}
                      onChange={e => setPasswords({...passwords, new_password_confirmation: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
                    />
                 </div>

                 <div className="md:col-span-2 flex justify-end pt-4 border-t border-gray-100 mt-2">
                    <button 
                       type="submit"
                       disabled={isSaving}
                       className="flex items-center gap-2 px-8 py-3.5 hover:bg-gray-100 text-gray-900 border border-gray-200 font-black rounded-xl capitalize transition-all active:scale-95"
                    >
                       Update Password
                    </button>
                 </div>
              </form>
           </div>

        </div>
      </div>
    </div>
  );
}
