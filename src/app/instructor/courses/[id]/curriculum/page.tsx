'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, getCsrfCookie } from '@/lib/api';
import { Section } from '@/types/curriculum';
import CurriculumEditor from '@/components/instructor/CurriculumEditor';
import { Layout, BookOpen, Settings, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

const InstructorCurriculumPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const [response] = await Promise.all([
          api.get(`/courses/${id}`),
          getCsrfCookie()
        ]);
        setCourse(response.data);
      } catch (error) {
        console.error("Failed to fetch course", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (isLoading) return (
     <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-gray-400">Retreiving Curriculum...</p>
     </div>
  );
  
  if (!course) return <div className="p-20 text-center text-red-500 font-bold">Course not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-8">
        <header className="mb-12">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex items-center gap-6">
                <Link href="/instructor/courses" className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
                  <ChevronLeft size={24} className="text-gray-900" />
                </Link>
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">Course Architect</span>
                      {course.status === 'PUBLISHED' && <span className="text-xs font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">Live</span>}
                   </div>
                   <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-[0.9]">{course.course_title}</h1>
                   <p className="text-xs text-gray-400 font-bold mt-3 flex items-center gap-2">
                      <BookOpen size={12} /> Curriculum Management / Structure
                   </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <Link href={`/instructor/courses/${id}`}>
                    <button className="h-14 px-8 bg-white border border-gray-100 text-gray-900 font-black rounded-2xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-3">
                       <Settings size={18} /> Settings
                    </button>
                 </Link>
                 <Link href={`/courses/${course.slug}/learn`}>
                    <button className="h-14 px-8 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl flex items-center gap-3">
                       <Sparkles size={18} className="text-emerald-400" /> Preview Mode
                    </button>
                 </Link>
              </div>

           </div>
        </header>

        <main className="pb-20">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm">
               <CurriculumEditor courseId={Number(id)} initialSections={course.sections} />
            </div>
        </main>
    </div>
  );
};

export default InstructorCurriculumPage;
