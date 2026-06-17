'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Bookmark, Eye, Star, Heart } from 'lucide-react';
import CourseAvatar from '@/components/CourseAvatar';


interface Author { picture: string; fullname: string; }
interface Course {
  id: number; slug: string; thumbnail: string; course_title: string; view: number;
  author: Author; userHasLiked: boolean; userHasDisliked: boolean; hasBookmarked: boolean;
  is_unlocked: boolean; is_private: boolean; isPaid: boolean; price?: number;
  formattedPrice: string; level?: string; progress_percentage?: number;
}
interface CourseCardProps { course: Course; }

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const [userHasBookmarked, setUserHasBookmarked] = useState(course.hasBookmarked);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      if (userHasBookmarked) {
        await api.delete(`/course/${course.id}/delete-bookmark`);
        setUserHasBookmarked(false);
      } else {
        await api.post(`/course/${course.id}/create-bookmark`);
        setUserHasBookmarked(true);
      }
    } catch {}
  };

  return (
    <div className="flex flex-col bg-white rounded-[32px] border border-gray-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer group overflow-hidden h-full">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Link href={`/course/${course.slug}`}>
          <CourseAvatar
            title={course.course_title}
            thumbnail={course.thumbnail}
            className="w-full h-full group-hover:scale-105 transition-transform duration-700"
            imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-bold text-gray-900 shadow-sm border border-gray-100/50">
            <Eye size={12} className="text-blue-500" /> {course.view}
          </div>
          {course.level && (
            <div className="px-3 py-1.5 bg-gray-950/80 backdrop-blur-md rounded-xl text-[10px] font-bold text-white border border-white/10">
              {course.level}
            </div>
          )}
        </div>

        <button 
          onClick={toggleBookmark}
          className={`absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center transition-all shadow-sm border border-gray-100/50 hover:bg-white active:scale-90 ${userHasBookmarked ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
        >
          <Bookmark size={16} fill={userHasBookmarked ? 'currentColor' : 'none'} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-col p-6 flex-1">
        <div className="flex items-start justify-between gap-4 mb-3">
          <Link href={`/course/${course.slug}`} className="flex-1">
            <h3 className="text-base font-black text-gray-900 leading-[1.3] group-hover:text-blue-600 transition-colors line-clamp-2">
              {course.course_title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600 border border-blue-100 shrink-0">
            {course.author.fullname[0]}
          </div>
          <span className="text-xs font-bold text-gray-400">{course.author.fullname}</span>
        </div>

        <div className="mt-auto space-y-4">
          {course.progress_percentage !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-gray-400  tracking-wider">Progress</span>
                <span className="text-[10px] font-bold text-blue-600">{course.progress_percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-[2px]">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${course.progress_percentage}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
              <Star size={12} fill="#fb8c00" className="text-[#fb8c00]" />
              <span className="text-[11px] font-bold text-amber-700">4.8</span>
            </div>
            <div className="text-sm font-black text-gray-950 flex flex-col items-end leading-tight">
              {course.isPaid ? (
                <>
                  <span className="text-[10px] text-gray-400 font-bold  tracking-wider line-through decoration-red-500/50">${(parseFloat(course.formattedPrice) * 1.5).toFixed(2)}</span>
                  <span className="text-blue-600 text-lg tracking-tight">${course.formattedPrice}</span>
                </>
              ) : (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-black">Free course</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
