'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import CourseCard from '@/components/CourseCard';
import { BookOpen, Compass, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrolled');

  useEffect(() => {
    Promise.all([
      api.get('/student/courses'),
      // Also fetch the continue-learning endpoint for each course
      api.get('/student/courses').then(res => 
        Promise.all(
          (res.data || []).map((c: any) => 
            api.get(`/student/courses/${c.slug}/continue`).catch(() => ({ data: null }))
          )
        )
      )
    ]).then(([mainRes, continueData]) => {
      const continueMap = new Map();
      (continueData || []).forEach((item: any, i: number) => {
        if (item?.data) continueMap.set(mainRes.data[i]?.id, item.data);
      });
      setCourses((mainRes.data || []).map((c: any) => ({
        ...c,
        continue_node: continueMap.get(c.id) || null
      })));
    })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-8">
      {/* Header section */}
      <div className="mb-12">
         <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-4 capitalize">My Learning</h1>
         <p className="text-gray-500 font-medium tracking-wide text-lg">Continue your journey right where you left off.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100 mb-10 overflow-x-auto">
         <button 
           onClick={() => setActiveTab('enrolled')}
           className={`px-6 py-4 font-bold capitalize text-xs whitespace-nowrap transition-colors ${
             activeTab === 'enrolled' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-900'
           }`}
         >
            Enrolled Courses
         </button>
         <button 
           onClick={() => setActiveTab('wishlist')}
           className={`px-6 py-4 font-bold capitalize text-xs whitespace-nowrap transition-colors ${
             activeTab === 'wishlist' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-900'
           }`}
         >
            Wishlist
         </button>
         <button 
           onClick={() => setActiveTab('certificates')}
           className={`px-6 py-4 font-bold capitalize text-xs whitespace-nowrap transition-colors flex items-center gap-2 ${
             activeTab === 'certificates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-900'
           }`}
         >
            <Trophy size={14} /> My Certificates
         </button>
      </div>

      {/* Tab Content */}
      <div className="pb-20">
         {activeTab === 'enrolled' && (
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                 {[1, 2, 3, 4].map(i => <div key={i} className="h-96 bg-gray-50 rounded-[2.5rem] animate-pulse border border-gray-100"></div>)}
              </div>
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                 {courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                 ))}
              </div>
            ) : (
              <EmptyState 
                 icon={<BookOpen size={40} />} 
                 title="No active enrollments"
                 desc="It looks like you haven't started any courses yet. Explore our verified catalog to pick your first pathway."
                 actionUrl="/courses"
                 actionText="Explore Courses"
                 actionIcon={<Compass size={18} />}
              />
            )
         )}

         {activeTab === 'wishlist' && (
            <EmptyState 
               icon={<Compass size={40} />} 
               title="Your wishlist is empty"
               desc="Save courses to your wishlist so you can easily find them later."
               actionUrl="/courses"
               actionText="Discover Courses"
            />
         )}

         {activeTab === 'certificates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] border-2 border-dashed border-blue-200 flex flex-col items-center justify-center p-8 text-center">
                  <Trophy className="text-blue-300 mb-4" size={48} />
                  <h4 className="text-lg font-black text-blue-900 mb-2">No Certificates Yet</h4>
                  <p className="text-xs font-bold text-blue-600/70 capitalize">Complete 100% of a course</p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc, actionUrl, actionText, actionIcon }: any) {
  return (
      <div className="py-24 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-[3rem]">
         <div className="w-20 h-20 bg-blue-100/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-blue-600">
            {icon}
         </div>
         <h4 className="text-2xl font-black text-gray-900 mb-3 capitalize tracking-tight">{title}</h4>
         <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto leading-relaxed">{desc}</p>
         <Link href={actionUrl} className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-blue-600 text-white font-black rounded-2xl capitalize shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
            {actionIcon} {actionText}
         </Link>
      </div>
  );
}
