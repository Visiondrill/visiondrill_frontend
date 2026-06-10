'use client';

import React from 'react';
import { Bell, ShieldCheck, Clock } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize mb-2">Notifications</h1>
          <p className="text-gray-500 font-medium">Keep track of your learning activity and system updates.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
            <Bell size={32} />
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tighter mb-4">No new transmissions</h3>
          <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
            Your notification queue is currently empty. We will notify you when courses update or instructors reach out.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 p-8 rounded-[2rem] flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">System Security</p>
            <p className="text-sm font-bold text-gray-900 mb-2">Account verified successfully</p>
            <p className="text-xs text-gray-400 font-medium">Your credentials have been synchronized with the core database.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-8 rounded-[2rem] flex items-start gap-4 shadow-sm opacity-50">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Learning History</p>
            <p className="text-sm font-bold text-gray-900 mb-2">Curriculum update incoming</p>
            <p className="text-xs text-gray-400 font-medium">New lessons will be deployed to your active courses soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
