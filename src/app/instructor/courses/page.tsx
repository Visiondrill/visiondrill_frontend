'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  BookOpen, Users, Plus, Search, Layout, Trash2, Globe, Loader2, X, Sparkles,
  ChevronRight, ShieldCheck, Zap, ArrowLeft, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: number;
  slug: string;
  course_title: string;
  thumbnail: string | null;
  enrollments_count: number;
  price: number;
  status: string;
  category?: { name: string };
}

interface Stats {
  total_courses: number;
  total_students: number;
  published_count: number;
}

import CourseCreateModal from '@/components/instructor/CourseCreateModal';

export default function InstructorCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const router = useRouter();

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (confirmDeleteId) {
      const timer = setTimeout(() => setConfirmDeleteId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDeleteId]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    
    try {
      await api.delete(`/instructor/courses/${id}`);
      setCourses(prev => prev.filter(c => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleModalSubmit = async (data: { course_title: string; category_id: string; price: string }) => {
    setCreating(true);
    try {
      const payload = {
        course_title: data.course_title,
        category_id: data.category_id ? parseInt(data.category_id) : null,
        price: data.price ? parseFloat(data.price) : 0
      };
      const res = await api.post('/instructor/create-course', payload);
      setCourses(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      router.push(`/instructor/courses/${res.data.id}/curriculum`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [coursesRes, statsRes] = await Promise.all([
        api.get('/instructor/courses'),
        api.get('/instructor/dashboard-stats'),
      ]);
      setCourses(coursesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Data fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);


  const filtered = courses.filter(c => {
    const matchesSearch = c.course_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'ALL' || c.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getCount = (status: string) => courses.filter(c => c.status === status).length;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-gray-400">Syncing library...</p>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8">

      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
         <div className="relative flex-grow max-w-2xl w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input
               type="text"
               placeholder="Search Courses..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none font-bold text-gray-900 transition-all shadow-sm text-xs"
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 h-14 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 text-[10px] tracking-widest uppercase active:scale-95"
            >
              <Plus size={16} /> NEW COURSE
            </button>
          </div>
      </div>

      <div className="flex items-center gap-8 mb-12 border-b border-gray-100 px-2 overflow-x-auto scrollbar-hide">
          <TabItem label="All" count={courses.length} active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} />
          <TabItem label="Published" count={getCount('PUBLISHED')} active={activeTab === 'PUBLISHED'} onClick={() => setActiveTab('PUBLISHED')} />
          <TabItem label="Drafts" count={getCount('DRAFT')} active={activeTab === 'DRAFT'} onClick={() => setActiveTab('DRAFT')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
         {filtered.map(course => (
            <div 
              key={course.id} 
              onClick={() => router.push(`/instructor/courses/${course.id}/curriculum`)}
              className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-blue-50 transition-all group cursor-pointer flex flex-col h-full"
            >
               <div className="relative h-44 bg-gray-100 overflow-hidden">
                  {course.thumbnail ? (
                     <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <BookOpen size={32} className="text-gray-200" />
                     </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {course.status === 'PUBLISHED' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-black tracking-widest uppercase shadow-lg shadow-emerald-200 flex items-center gap-1.5 animate-in fade-in duration-500">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        Live
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[9px] font-black tracking-widest uppercase shadow-lg shadow-amber-200 animate-in slide-in-from-left-2 duration-300">
                        Draft
                      </span>
                    )}
                    {course.enrollments_count > 0 && (
                      <span className="px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-[9px] font-black tracking-widest text-white uppercase shadow-sm flex items-center gap-1">
                        <Users size={10} /> {course.enrollments_count}
                      </span>
                    )}
                  </div>
               </div>

               <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 className="text-sm font-black text-gray-900 tracking-tight line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors uppercase leading-tight">
                       {course.course_title}
                    </h3>
                    <p className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                      {course.price > 0 ? `KES ${course.price}` : 'FREE'}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-6 flex items-center gap-2">
                      <button className="flex-grow h-12 bg-gray-950 text-white font-black rounded-xl text-[10px] tracking-widest uppercase hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200">
                        <Layout size={14} /> EDIT COURSE
                      </button>
                      <button 
                         onClick={(e) => handleDelete(course.id, e)}
                         className={`h-12 border transition-all shadow-sm flex items-center justify-center gap-2 overflow-hidden px-4 ${
                           confirmDeleteId === course.id 
                           ? 'bg-red-500 border-red-500 text-white w-28 rounded-xl' 
                           : 'bg-white border-gray-100 text-gray-300 hover:text-red-500 hover:border-red-100 w-12 rounded-xl'
                         }`}
                       >
                         {confirmDeleteId === course.id ? (
                           <span className="text-[9px] font-black tracking-widest uppercase animate-in slide-in-from-right-2">Confirm?</span>
                         ) : (
                           <Trash2 size={16} />
                         )}
                      </button>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
    <CourseCreateModal 
      isOpen={showCreateModal} 
      onClose={() => setShowCreateModal(false)}
      onSubmit={handleModalSubmit}
      isCreating={creating}
    />
    </>
  );
}

function TabItem({ label, count, active, onClick }: { label: string, count: number, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`pb-4 px-2 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
        active 
          ? 'border-blue-600 text-gray-900 opacity-100' 
          : 'border-transparent text-gray-400 hover:text-gray-600 opacity-60'
      }`}
    >
      <span className="text-xs font-black tracking-widest uppercase">{label}</span>
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
      }`}>
        {count}
      </span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, badge, color }: any) {
  return (
    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all group min-h-[120px] flex flex-col justify-between">
       <div>
          <div className="flex items-center justify-between mb-4">
             <div className={`${color}`}><Icon size={18} /></div>
             <span className={`text-xs font-black ${color}`}>{badge}</span>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tighter mb-0.5">{value}</div>
       </div>
       <p className="text-xs font-medium text-gray-400">{label}</p>
    </div>
  );
}

