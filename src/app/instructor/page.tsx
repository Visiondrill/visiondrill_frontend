'use client';

import React, { useState, useEffect } from 'react';
import { api, getCsrfCookie } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Users, Plus, ChevronRight, Clock 
} from 'lucide-react';
import CourseCreateModal from '@/components/instructor/CourseCreateModal';

export default function InstructorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, coursesRes, statsRes] = await Promise.all([
           api.get('/me'),
           api.get('/instructor/courses'),
           api.get('/instructor/dashboard-stats'),
           getCsrfCookie()
        ]);
        setUser(meRes.data);
        setCourses(coursesRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);



  const handleModalSubmit = async (data: { course_title: string; category_id: string; price: string }) => {
    setIsCreating(true);
    try {
      await getCsrfCookie();
      const payload = {
        course_title: data.course_title,
        category_id: data.category_id ? parseInt(data.category_id) : null,
        price: data.price ? parseFloat(data.price) : 0
      };
      const res = await api.post('/instructor/create-course', payload);
      if (res.data?.id) {
        router.push(`/instructor/courses/${res.data.id}/curriculum`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
      setShowCreateModal(false);
    }
  };

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* 1. Center Column: Operations Hub */}
      <div className="flex-1 min-w-0 space-y-10">
        


         {/* Courses Created / Published Metric */}
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-gray-100/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="max-w-md">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                       Courses
                    </h2>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                       <Plus size={14} strokeWidth={3} />
                       NEW CURRICULUM
                    </button>
                  </div>
                   <p className="text-sm font-medium text-gray-400 mt-2">Your curriculum overview</p>
                   {user?.created_at && (
                     <p className="text-xs font-semibold text-gray-400 mt-1.5">
                       Joined {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                     </p>
                   )}
               </div>
               <div className="flex gap-10">
                  <div className="text-center">
                     <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">CREATED</p>
                     <p className="text-4xl font-black font-sans text-gray-900">{courses.length || '0'}</p>
                  </div>
                  <div className="w-[1px] h-16 bg-gray-100 mt-2" />
                  <div className="text-center">
                     <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">PUBLISHED</p>
                     <p className="text-4xl font-black font-sans text-blue-600">{stats?.published_count || '0'}</p>
                  </div>
               </div>
            </div>
         </div>



      </div>

      {/* 2. Right Column: System Performance (Sticky) */}
      <aside className="w-full lg:w-80 xl:w-96 space-y-10 shrink-0 lg:sticky lg:top-10 h-fit">
          

          {/* Revenue Velocity Graph Strip */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                 <h4 className="text-sm font-black text-gray-900  tracking-widest">Revenue</h4>
                <TrendingUp size={16} className="text-emerald-500" />
             </div>
             <div className="flex items-end justify-between gap-2 h-32">
                {[30, 45, 35, 70, 60, 90, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-gray-50 rounded-t-lg group relative cursor-pointer flex flex-col justify-end overflow-hidden">
                     <div className="w-full bg-blue-600 opacity-20 group-hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                  </div>
                ))}
             </div>
             <p className="text-[10px] text-center text-gray-400 font-bold mt-6">Week-over-week performance index</p>
          </div>

          {/* Recent Enrollments Assets */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
             <h4 className="text-sm font-black text-gray-900  tracking-widest mb-2">Student activity</h4>
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 transition-all rounded-2xl -mx-2 p-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                     <Users size={18} />
                  </div>
                  <div className="min-w-0">
                     <p className="text-xs font-black text-gray-900 truncate tracking-tight">New enrollment recorded</p>
                     <p className="text-[9px] text-gray-400 font-bold  mt-0.5">2 minutes ago</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-gray-200 group-hover:text-blue-600 transition-colors" />
               </div>
             ))}
             <button className="w-full py-4 bg-gray-50 text-blue-600 text-[10px] font-black  tracking-widest rounded-2xl hover:bg-blue-50 transition-all mt-4">
                View audit logs
             </button>
          </div>
      </aside>
    </div>
    <CourseCreateModal 
      isOpen={showCreateModal} 
      onClose={() => setShowCreateModal(false)}
      onSubmit={handleModalSubmit}
      isCreating={isCreating}
    />
    </>
  );
}


