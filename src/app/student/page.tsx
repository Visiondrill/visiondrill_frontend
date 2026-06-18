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
  ChevronLeft,
  X,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import CourseAvatar from '@/components/CourseAvatar';


export default function StudentDashboardPreview() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [popularCourses, setPopularCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, coursesRes, statsRes, popularRes] = await Promise.all([
          api.get('/me'),
          api.get('/student/courses'),
          api.get('/student/dashboard-stats'),
          api.get('/courses/popular')
        ]);
        setUser(userRes.data);
        setCourses(coursesRes.data);
        setStats(statsRes.data);
        setPopularCourses(popularRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derive unique levels from enrolled courses
  const allLevels = Array.from(new Set(courses.map((c: any) => c.level).filter(Boolean)));

  // Filter courses by search query and selected level
  const displayedCourses = courses.filter((course: any) => {
    const matchesSearch = !searchQuery || 
      course.course_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  if (isLoading) return <StudentDashboardSkeleton />;

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
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-white border border-gray-100 rounded-[2rem] pl-16 pr-6 py-4 text-sm font-medium focus:border-blue-200 outline-none transition-all shadow-sm shadow-gray-50"
             />
          </div>
          <div className="relative">
             <button 
               onClick={() => setShowFilterDropdown(!showFilterDropdown)}
               className={`p-4 bg-white border rounded-[1.2rem] transition-all shadow-sm ${
                 selectedLevel ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-gray-400 border-gray-100 hover:text-blue-600'
               }`}
             >
                <Filter size={20} />
             </button>
             {showFilterDropdown && (
               <div className="absolute right-0 top-14 w-56 bg-white border border-gray-100 rounded-[1.5rem] shadow-xl shadow-gray-200/50 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 py-2">
                     <span className="text-[9px] font-black text-gray-400 tracking-[0.2em] uppercase">Filter by Level</span>
                     <button onClick={() => setShowFilterDropdown(false)} className="text-gray-300 hover:text-gray-600">
                        <X size={14} />
                     </button>
                  </div>
                  <div className="h-px bg-gray-50 my-1" />
                  <button
                    onClick={() => { setSelectedLevel(null); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                      !selectedLevel ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    All Levels
                  </button>
                  {allLevels.map((level: string) => (
                    <button
                      key={level}
                      onClick={() => { setSelectedLevel(level); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold capitalize transition-all ${
                        selectedLevel === level ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
               </div>
             )}
             {showFilterDropdown && (
               <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} />
             )}
          </div>
        </div>

        {/* Hero Banner — only shown when user has enrolled courses */}
        {courses.length > 0 && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 md:px-10 md:py-8 text-white relative overflow-hidden shadow-2xl shadow-blue-100 min-h-[240px] flex items-center">
             <div className="absolute top-0 right-0 p-32 bg-white/10 blur-[60px] rounded-full -mr-24 -mt-24"></div>
             <div className="absolute bottom-0 left-0 p-24 bg-indigo-500/20 blur-[60px] rounded-full -ml-16 -mb-16"></div>
             <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="max-w-md">
                   <p className="text-[9px] font-black tracking-[0.3em] mb-2 text-blue-100 opacity-80">
                     Resume: {courses[0].course_title}
                   </p>
                   <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-6">
                     Pick up where you left off
                   </h1>
                   <Link href={`/student/learn/${courses[0].slug}`}>
                      <button className="flex items-center gap-3 px-6 py-2.5 bg-gray-900 text-white text-[10px] font-black rounded-full hover:scale-105 active:scale-95 transition-all tracking-[0.2em]">
                         Resume <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center ml-1"><Play size={8} fill="white" /></div>
                      </button>
                   </Link>
                </div>

                <div className="w-full md:w-64 space-y-2.5">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black tracking-widest text-blue-200">Session progress</span>
                      <span className="text-lg font-black font-sans leading-none">45%</span>
                   </div>
                   <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-white w-[45%]" />
                   </div>
                   <p className="text-[9px] font-bold text-blue-100/60 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 12 lessons remaining
                   </p>
                </div>
             </div>
          </div>
        )}

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
           
           {displayedCourses.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {displayedCourses.slice(0, 3).map((course) => (
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
                             <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg tracking-widest uppercase">
                               {(course.sections?.[0]?.title || 'CORE MODULE').split(' ')[0]}
                             </span>
                             <h4 className="text-sm font-black text-gray-900 mt-4 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 underline-offset-4 group-hover:underline">
                               {course.course_title}
                             </h4>
                          </div>
                          <div>
                             <div className="h-1.5 w-full bg-gray-100 rounded-full mt-6 overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 transition-all duration-1000" 
                                  style={{ width: `${course.progress_percentage || 0}%` }} 
                                />
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
             </div>
           ) : (
             <div className="col-span-3 py-12 text-center text-gray-400 font-medium italic">
                {searchQuery || selectedLevel 
                  ? 'No courses match your current search or filter.' 
                  : 'No active enrollments found. Explore our marketplace to start learning.'
                }
             </div>
           )}
        </section>

         {popularCourses.length > 0 && (
           <section>
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Suggested For You</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Handpicked based on trending topics</p>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-2 border border-gray-100 rounded-xl text-gray-300 hover:text-blue-600 transition-all"><ChevronLeft size={18} /></button>
                    <button className="p-2 border border-blue-100 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><ChevronRight size={18} /></button>
                 </div>
              </div>
              
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
                 {popularCourses.map((course) => (
                   <Link key={course.id} href={`/courses/${course.slug}`} className="snap-start shrink-0 w-[240px]">
                     <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden group hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                        {/* Thumbnail */}
                        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                           <CourseAvatar
                             title={course.course_title}
                             thumbnail={course.thumbnail || course.image || null}
                             className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                             imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                           />
                           {course.level && (
                             <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black px-2 py-0.5 rounded-md tracking-widest uppercase">
                               {course.level}
                             </div>
                           )}
                        </div>
                        {/* Body */}
                        <div className="p-4 flex flex-col gap-2.5 flex-1">
                           <h4 className="text-xs font-black text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                             {course.course_title}
                           </h4>
                           {/* Author */}
                           <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-black shrink-0">
                                {((course.author?.first_name || course.author?.fullname || 'T')[0]).toUpperCase()}
                              </div>
                              <span className="text-[10px] font-semibold text-gray-400 truncate">
                                {course.author?.first_name || course.author?.fullname || 'Expert Instructor'}
                              </span>
                           </div>
                           {/* Stars */}
                           <div className="flex items-center gap-1">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <svg key={s} className="w-2.5 h-2.5 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-amber-600">4.8</span>
                              <span className="text-[9px] text-gray-300 font-medium">(2.4k)</span>
                           </div>
                           {/* Price */}
                           <div className="mt-auto pt-2.5 border-t border-gray-50 flex items-center justify-between">
                              <span className={`text-sm font-black tracking-tight ${course.price > 0 ? 'text-gray-900' : 'text-emerald-600'}`}>
                                {course.price > 0 ? `$${Number(course.price).toLocaleString()}` : 'FREE'}
                              </span>
                              {course.price > 0 && (
                                <span className="text-[10px] font-medium text-gray-300 line-through">
                                  $ {Math.round(Number(course.price) * 1.4).toLocaleString()}
                                </span>
                              )}
                           </div>
                        </div>
                     </div>
                   </Link>
                 ))}
              </div>
           </section>
         )}
      </div>

      {/* 2. Right Sidebar (Sticky) */}
      <aside className="w-full lg:w-80 xl:w-96 space-y-10 shrink-0 lg:sticky lg:top-10 h-fit">
         
         {/* Profile Card */}
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
            <MoreVertical className="absolute top-8 right-8 text-gray-300 cursor-pointer" size={18} />
            
             <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full transform -rotate-90">
                   <svg className="w-full h-full" viewBox="0 0 128 128">
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="58" 
                        fill="transparent" 
                        stroke="#f3f4f6" 
                        strokeWidth="8" 
                      />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="58" 
                        fill="transparent" 
                        stroke="#2563eb" 
                        strokeWidth="8" 
                        strokeDasharray="364.4" 
                        strokeDashoffset={364.4 * (1 - (stats?.weekly_lessons_completed || 0) / 10)} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000 ease-out"
                      />
                   </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-black uppercase">
                      {user?.picture ? (
                         <Image src={user.picture} alt="Profile" fill className="object-cover" />
                      ) : (
                         <span className="drop-shadow-md">{user?.first_name?.[0] || 'P'}</span>
                      )}
                   </div>
                </div>
             </div>

            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-4">Good morning {user?.first_name || 'Operator'}</h3>
            <Link href="/student/notifications" className="hover:opacity-70 transition-opacity">
               <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-[200px]">
                 You have completed {stats?.weekly_lessons_completed || 0} lessons this week. Keep going!
               </p>
            </Link>

            <div className="flex gap-4 mt-10">
               <Link href="/student/notifications" className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                  <Bell size={18} />
               </Link>
               <Link href="/student/messaging" className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                  <Mail size={18} />
               </Link>
            </div>
         </div>

      </aside>
    </div>
  );
}

function StudentDashboardSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 animate-pulse">
      <div className="flex-1 space-y-10">
        <div className="flex gap-4">
          <div className="flex-1 h-14 bg-gray-100 rounded-[2rem]" />
          <div className="w-14 h-14 bg-gray-100 rounded-[1.2rem]" />
        </div>
        <div className="h-64 bg-gray-200 rounded-[2.5rem]" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-24 bg-gray-100 rounded-[2rem]" />
          <div className="h-24 bg-gray-100 rounded-[2rem]" />
          <div className="h-24 bg-gray-100 rounded-[2rem]" />
        </div>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-3 gap-8">
            <div className="h-80 bg-gray-100 rounded-[2.5rem]" />
            <div className="h-80 bg-gray-100 rounded-[2.5rem]" />
            <div className="h-80 bg-gray-100 rounded-[2.5rem]" />
          </div>
        </div>
      </div>
      <aside className="w-full lg:w-80 xl:w-96 space-y-10">
        <div className="h-[400px] bg-gray-100 rounded-[2.5rem]" />
        <div className="h-40 bg-gray-100 rounded-[2.5rem]" />
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
