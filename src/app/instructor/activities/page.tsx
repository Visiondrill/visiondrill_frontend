'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Activity, Clock, User, BookOpen, DollarSign, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InstructorActivities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/instructor/recent-activities');
      setActivities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-blue-600 transition-colors mb-6 uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back to console
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Architect activity logs</h1>
              <p className="text-gray-500 font-medium">Real-time stream of enrollments, sales, and system events.</p>
            </div>
            <button 
              onClick={fetchActivities}
              className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 hover:border-blue-100 text-xs font-black rounded-2xl transition-all shadow-sm group"
            >
              <RefreshCw size={14} className="group-active:animate-spin" /> Refresh Feed
            </button>
          </div>
        </header>

        <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Activity className="text-blue-600" size={20} />
              <h2 className="text-lg font-black text-gray-900 tracking-tighter">Event stream</h2>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="p-8 flex items-start gap-6 hover:bg-gray-50/50 transition-all group">
                  <div className={`w-14 h-14 rounded-2xl ${act.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center shrink-0 shadow-sm font-black`}>
                    {act.type === 'sale' ? <DollarSign size={24} /> : <User size={24} />}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <p className="text-base font-black text-gray-900 tracking-tight">
                        {act.student_name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                        <Clock size={12} /> {act.date}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-gray-600 font-medium leading-relaxed">
                        {act.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mt-2">
                        <BookOpen size={14} /> {act.course_title}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center">
                <Activity size={60} className="mx-auto text-gray-100 mb-6" />
                <h3 className="text-xl font-black text-gray-900 tracking-tighter mb-2">Quiet on the front</h3>
                <p className="text-gray-400 font-medium">No system events recorded yet.</p>
              </div>
            )}
          </div>

          {activities.length > 0 && (
            <div className="p-8 bg-gray-50/50 text-center border-t border-gray-50">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">End of logs • Live monitoring active</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
