'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Search,
  Filter,
  Play,
  Bell,
  Mail,
  MoreVertical,
  Star,
  Plus,
  BarChart3,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import Image from 'next/image';

export default function StudentDashboardPreview() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, coursesRes, statsRes] = await Promise.all([
          api.get('/me'),
          api.get('/student/courses'),
          api.get('/student/dashboard-stats')
        ]);
        setUser(userRes.data);
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

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="text-blue-600 animate-spin" size={32} />
      <p className="text-sm font-bold text-gray-400">Rendering workspace...</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* 1. Center Content (Template Middle Column) */}
      <div className="flex-1 min-w-0 space-y-10">
        
        {/* Search & Filter */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
             <input 
               placeholder="Search your course here..." 
               className="w-full bg-white border border-gray-100 rounded-[2rem] pl-16 pr-6 py-4 text-sm font-medium focus:border-blue-200 outline-none transition-all shadow-sm shadow-gray-50"
             />
          </div>
          <button className="p-4 bg-white border border-gray-100 rounded-[1.2rem] text-gray-400 hover:text-blue-600 transition-all shadow-sm">
             <Filter size={20} />
          </button>
        </div>

        {/* Hero Banner (Compacted to save space) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 md:px-10 md:py-8 text-white relative overflow-hidden shadow-2xl shadow-blue-100 min-h-[240px] flex items-center">
           <div className="absolute top-0 right-0 p-32 bg-white/10 blur-[60px] rounded-full -mr-24 -mt-24"></div>
           <div className="absolute bottom-0 left-0 p-24 bg-indigo-500/20 blur-[60px] rounded-full -ml-16 -mb-16"></div>
           <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-md">
                 <p className="text-[9px] font-black  tracking-[0.3em] mb-2 text-blue-100 opacity-80">
                   {courses.length > 0 ? `Resume: ${courses[0].course_title}` : 'Online course'}
                 </p>
                 <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-6">
                   {courses.length > 0 ? 'Pick up where you left off' : 'Sharpen your skills with professional curricula'}
                 </h1>
                 
                 <Link href={courses.length > 0 ? `/student/learn/${courses[0].slug}` : '/student/courses'}>
                    <button className="flex items-center gap-3 px-6 py-2.5 bg-gray-900 text-white text-[10px] font-black rounded-full hover:scale-105 active:scale-95 transition-all  tracking-[0.2em]">
                       Join now <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center ml-1"><Play size={8} fill="white" /></div>
                    </button>
                 </Link>
              </div>

              {courses.length > 0 && (
                <div className="w-full md:w-64 space-y-2.5">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black  tracking-widest text-blue-200">Session progress</span>
                      <span className="text-lg font-black font-sans leading-none">45%</span>
                   </div>
                   <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-white w-[45%]" />
                   </div>
                   <p className="text-[9px] font-bold text-blue-100/60 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 12 lessons remaining
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* Progress Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <TelemetryCard 
             label="Hours learned" 
             value={stats?.hours_learned || '0.0'} 
             sub={`+${stats?.weekly_lessons_completed || 0} this week`}
           />
           <TelemetryCard 
             label="Total enrolled" 
             value={stats?.enrolled_courses || '0'} 
             sub={`${courses.length} active courses`}
           />
           <TelemetryCard 
             label="Certifications" 
             value={stats?.certificates_earned || '0'} 
             sub="Ready to download"
           />
        </div>

        {/* Continue Watching (Course Grid) */}
        <section>
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Continue watching</h3>
              <div className="flex gap-2">
                 <button className="p-2 border border-gray-100 rounded-xl text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all"><ChevronLeft size={20} /></button>
                 <button className="p-2 border border-blue-100 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><ChevronRight size={20} /></button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {courses.slice(0, 3).map((course) => (
                <Link key={course.id} href={`/student/learn/${course.slug}`}>
                  <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-gray-100/50 transition-all cursor-pointer h-full flex flex-col">
                     <div className="aspect-[4/3] bg-gray-100 relative shrink-0">
                        <Image src={course.image || '/course-placeholder.jpg'} alt={course.course_title} fill className="object-cover" />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-xl text-gray-400">
                           <Star size={14} />
                        </div>
                     </div>
                     <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                           <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg tracking-widest">Frontend</span>
                           <h4 className="text-sm font-black text-gray-900 mt-4 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 underline-offset-4 group-hover:underline">
                             {course.course_title}
                           </h4>
                        </div>
                        <div>
                           <div className="h-1.5 w-full bg-gray-100 rounded-full mt-6 overflow-hidden">
                              <div className="h-full bg-blue-600 w-[45%]" />
                           </div>
                           <div className="mt-6 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm" />
                                 <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-900 truncate">{course.author?.first_name || 'Expert Instructor'}</p>
                                    <p className="text-[9px] font-bold text-gray-400 tracking-widest">Operator</p>
                                 </div>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 translate-x-0 group-hover:translate-x-1 transition-all" />
                           </div>
                        </div>
                     </div>
                  </div>
                </Link>
              ))}
              {courses.length === 0 && (
                <div className="col-span-3 py-12 text-center text-gray-400 font-medium italic">
                   No active enrollments found. Explore our marketplace to start learning.
                </div>
              )}
           </div>
        </section>

        {/* Suggested Courses (Left-to-Right Scrolling) */}
        <section>
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Suggested courses</h3>
              <div className="flex gap-2">
                 <button className="p-2 border border-gray-100 rounded-xl text-gray-300 hover:text-blue-600 transition-all"><ChevronLeft size={20} /></button>
                 <button className="p-2 border border-blue-100 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><ChevronRight size={20} /></button>
              </div>
           </div>
           
           <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="min-w-[300px] md:min-w-[340px] bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-gray-100/50 transition-all snap-start">
                   <div className="aspect-video bg-gray-100 relative">
                      <Image 
                        src={`https://images.unsplash.com/photo-${1500000000000 + (i * 100000)}?q=80&w=800&auto=format&fit=crop`} 
                        alt="Course preview" 
                        fill 
                        className="object-cover group-hover:scale-105 transition-all duration-500" 
                      />
                      <div className="absolute top-4 left-4 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-lg  tracking-widest">Trending</div>
                   </div>
                   <div className="p-8 pb-10">
                      <h4 className="text-lg font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors mb-4 truncate">
                        Advanced data structures and algorithm design node {i}
                      </h4>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                            <span className="text-xs font-bold text-gray-400">Expert tutor</span>
                         </div>
                         <p className="text-lg font-black text-gray-900 font-sans text-sm leading-none">KES 4,500</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>

      {/* 2. Right Sidebar (Sticky) */}
      <aside className="w-full lg:w-80 xl:w-96 space-y-10 shrink-0 lg:sticky lg:top-10 h-fit">
         
         {/* Profile Card */}
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
            <MoreVertical className="absolute top-8 right-8 text-gray-300 cursor-pointer" size={18} />
            
            <div className="relative mb-6">
               <div className="w-32 h-32 rounded-full border-4 border-gray-50 p-2 transform -rotate-90">
                  <svg className="w-full h-full">
                     <circle cx="56" cy="56" r="50" fill="transparent" stroke="#2563eb" strokeWidth="8" strokeDasharray="314" strokeDashoffset="80" strokeLinecap="round" />
                  </svg>
               </div>
               <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="w-24 h-24 rounded-full bg-gray-100 relative overflow-hidden border-4 border-white shadow-xl">
                     <Image src={user?.picture || '/default-user.jpg'} alt="Profile" fill className="object-cover" />
                  </div>
               </div>
            </div>

            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-4">Good morning {user?.first_name || 'Operator'}</h3>
            <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-[200px]">You have completed {stats?.weekly_lessons_completed || 0} lessons this week. Keep going!</p>

            <div className="flex gap-4 mt-10">
               <div className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                  <Bell size={18} />
               </div>
               <div className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                  <Mail size={18} />
               </div>
               <div className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                  <Mail size={18} />
               </div>
            </div>
         </div>

         {/* Activity Graph Strip */}
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
            <div className="flex items-end justify-between gap-2 h-40">
               {[40, 60, 50, 90, 70, 100, 80].map((h, i) => (
                 <div key={i} className="flex-1 bg-blue-100 rounded-t-xl group relative cursor-pointer flex flex-col justify-end overflow-hidden">
                    <div className="w-full bg-blue-600 opacity-20 group-hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                    <div className="absolute inset-x-0 bottom-0 py-2 text-center text-[8px] font-sans font-black text-blue-900 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
                       {h}%
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Your Mentor Follow List */}
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-xl font-black text-gray-900 tracking-tight">Your mentor</h3>
               <button className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Plus size={16} /></button>
            </div>
            
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between group">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 shadow-inner" />
                    <div>
                       <p className="text-xs font-black text-gray-900 leading-tight">Prashant Kumar Singh</p>
                       <p className="text-[9px] font-bold text-gray-400  tracking-widest mt-0.5">Software developer</p>
                    </div>
                 </div>
                 <button className="px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black  tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-100">
                    Follow
                 </button>
              </div>
            ))}

            <button className="w-full py-4 bg-gray-50 text-blue-600 text-[10px] font-black  tracking-widest rounded-2xl hover:bg-blue-50 transition-all mt-4">
               See all
            </button>
         </div>
      </aside>
    </div>
  );
}

function TelemetryCard({ label, value, sub }: any) {
  return (
    <div className="bg-white border border-gray-100 p-6 rounded-[2rem] flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-0.5 ">{label}</p>
            <p className="text-xl font-black text-gray-900 leading-none font-sans tracking-tighter">{value}</p>
            <p className="text-[9px] font-medium text-blue-500 mt-1">{sub}</p>
          </div>
      </div>
      <MoreVertical className="text-gray-200 group-hover:text-gray-400 transition-colors cursor-pointer" size={18} />
    </div>
  );
}
