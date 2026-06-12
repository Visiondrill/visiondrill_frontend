'use client';

import React, { useState, useEffect } from 'react';
import { api, getCsrfCookie } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Users, Play, BarChart3, Plus, MoreVertical, Star, ChevronRight,
  ShieldCheck, Zap, Globe, Wallet, Clock, Sparkles
} from 'lucide-react';
import CourseCreateModal from '@/components/instructor/CourseCreateModal';

export default function InstructorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCourseTitle, setNewCourseTitle] = useState('');
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

  const handleCreateCourse = async (e: React.FormEvent, directTitle?: string) => {
    if (e) e.preventDefault();
    const title = directTitle || newCourseTitle;
    if (!title.trim()) return;
    
    setIsCreating(true);
    try {
      await getCsrfCookie();
      const payload = {
        course_title: title,
        category_id: null,
        price: 0
      };
      const res = await api.post('/instructor/create-course', payload);
      if (res.data?.id) {
        router.push(`/instructor/courses/${res.data.id}/curriculum`);
      }
    } catch (err) {
      console.error('Course creation failed:', err);
    } finally {
      setIsCreating(false);
    }
  };

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
        
        {/* Command Search */}
        <div className="flex items-center gap-4">
           <div className="flex-1 relative group">
              <Plus className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input 
                placeholder="Initialize new curriculum..." 
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (newCourseTitle ? handleCreateCourse(e as any) : setShowCreateModal(true))}
                disabled={isCreating}
                className="w-full bg-white border border-gray-100 rounded-[2rem] pl-16 pr-6 py-5 text-sm font-bold focus:border-blue-200 outline-none transition-all shadow-xl shadow-gray-100/50"
              />
           </div>
           <button 
             onClick={() => newCourseTitle ? handleCreateCourse(null as any) : setShowCreateModal(true)}
             disabled={isCreating}
             className="bg-blue-600 text-white w-14 h-14 flex items-center justify-center rounded-[1.2rem] shadow-xl shadow-blue-200 hover:scale-105 hover:bg-black transition-all active:scale-95 disabled:opacity-50 shrink-0"
           >
              {isCreating ? <Clock className="animate-spin" size={20} /> : <Plus size={24} strokeWidth={3} />}
           </button>
        </div>

         {/* Courses Created / Published Metric */}
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-gray-100/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="max-w-md">
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                     Courses
                  </h2>
                  <p className="text-sm font-medium text-gray-400 mt-2">Your curriculum overview</p>
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


        {/* Active Curriculum Assets */}
        <section>
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Active course assets</h3>
              <Link href="/instructor/courses" className="text-blue-600 text-[10px] font-black  tracking-widest hover:underline">View fleet</Link>
           </div>
           
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {courses.slice(0, 4).map((course) => (
                <div 
                  key={course.id} 
                  onClick={() => router.push(`/instructor/courses/${course.id}/curriculum`)}
                  className="bg-white border border-gray-100 rounded-[2.5rem] p-6 lg:p-8 flex gap-5 hover:shadow-xl hover:shadow-gray-100/50 transition-all group cursor-pointer"
                >
                   <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gray-100 relative overflow-hidden shrink-0 shadow-inner">
                      <Image src={course.image || '/course-placeholder.jpg'} alt={course.course_title} fill className="object-cover" />
                   </div>

                   <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                         <div className="flex items-center justify-between mb-2">
                           <span className={`text-[9px] font-black px-3 py-1 rounded-lg  tracking-widest ${
                             course.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                           }`}>
                             {course.status}
                           </span>
                           <MoreVertical size={16} className="text-gray-200" />
                         </div>
                         <h4 className="text-sm font-black text-gray-900 leading-tight truncate group-hover:text-blue-600 transition-colors">
                           {course.course_title}
                         </h4>
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-4">
                         <div className="flex items-center gap-2">
                            <Users size={14} className="text-gray-300" />
                            <span className="text-[10px] font-black text-gray-400 font-sans">142 students</span>
                         </div>
                         <p className="text-sm font-black text-gray-900 font-sans">KES {course.price}</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>
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

function IntelCard({ label, value, icon, trend, color }: any) {
  return (
    <div className="bg-white border border-gray-100 p-6 rounded-[2rem] flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
       <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gray-50 ${color} flex items-center justify-center shadow-inner`}>
             {icon}
          </div>
          <div>
             <p className="text-[9px] font-black text-gray-400  tracking-widest mb-1">{label}</p>
             <p className="text-xl font-black text-gray-900 font-sans">{value}</p>
          </div>
       </div>
       <div className="text-right">
          <p className="text-[9px] font-black text-emerald-500">{trend}</p>
       </div>
    </div>
  );
}
