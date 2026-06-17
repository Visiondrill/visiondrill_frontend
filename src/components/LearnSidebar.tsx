'use client';

import React from 'react';
import { Section, Lesson } from '@/types/curriculum';
import { Play, PlayCircle, CheckCircle, ChevronRight, BookOpen, HelpCircle, FileText, Lock } from 'lucide-react';

interface LearnSidebarProps {
  sections: Section[];
  activeLessonId: number;
  onLessonSelect: (lessonId: number) => void;
  completedLessons?: number[];
}

export default function LearnSidebar({ sections, activeLessonId, onLessonSelect, completedLessons = [] }: LearnSidebarProps) {
  return (
    <div className="w-full flex flex-col h-full bg-white border-r border-gray-100">
      <div className="p-8 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
           <BookOpen className="text-blue-600" size={16} />
           <h3 className="font-black text-gray-900  tracking-[0.15em] text-[10px]">Curriculum Explorer</h3>
        </div>
        <p className="text-[10px] font-bold text-gray-400 ">12 Lessons • 4h 30m total</p>
      </div>
      
      <div className="flex-grow overflow-y-auto no-scrollbar py-4">
        {sections.map((section, sIdx) => (
          <div key={section.id} className="mb-6 px-4">
            <div className="px-4 py-3 bg-gray-50 rounded-xl flex items-center justify-between group cursor-default mb-2">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400  tracking-widest leading-none mb-1">Module {sIdx + 1}</span>
                  <h4 className="font-black text-gray-800 text-[11px]  tracking-tighter truncate max-w-[180px]">{section.title}</h4>
               </div>
               <div className="text-[10px] font-black text-blue-600 bg-white px-2 py-0.5 rounded-lg border border-blue-50">
                  {section.lessons.length}
               </div>
            </div>
            
            <div className="space-y-1">
              {section.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                const isCompleted = completedLessons.includes(lesson.id);
                
                const getIcon = () => {
                   if (isCompleted) return <CheckCircle size={16} className="text-emerald-500" />;
                   if (isActive) return <PlayCircle size={16} className="text-white" />;
                   
                   if (lesson.lesson_type === 'quiz' || lesson.content?.lesson_type === 'quiz') return <HelpCircle size={15} className="text-gray-300" />;
                   if (lesson.content?.document_url || lesson.content?.body) return <FileText size={15} className="text-gray-300" />;
                   return <Play size={15} className="text-gray-300" />;
                };

                const getDescriptor = () => {
                   if (lesson.lesson_type === 'quiz' || lesson.content?.lesson_type === 'quiz') return 'Knowledge Drill';
                   if (lesson.content?.document_url) return 'Document';
                   if (lesson.content?.body) return 'Reading Material';
                   return 'Video Lecture';
                };

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onLessonSelect(lesson.id)}
                    className={`w-full text-left px-5 py-4 rounded-xl flex items-center gap-4 transition-all group relative ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'hover:bg-gray-50 text-gray-500'}`}
                  >
                    <div className={`shrink-0 ${isActive ? 'text-white' : ''}`}>
                      {getIcon()}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={`text-[12px] font-black leading-tight truncate tracking-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`text-[9px] font-bold  tracking-widest ${isActive ? 'text-blue-100/70' : 'text-gray-400'}`}>
                            {getDescriptor()}{lesson.content?.video_url ? ' • 5m' : ''}
                         </span>
                      </div>
                    </div>
                    {isActive && (
                       <ChevronRight size={14} className="text-white/40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-8 border-t border-gray-100 bg-gray-50/50">
         <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-gray-400  tracking-widest">Your Achievement</span>
            <span className="text-[10px] font-black text-blue-600  tracking-widest">65%</span>
         </div>
         <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 w-[65%] rounded-full"></div>
         </div>
      </div>
    </div>
  );
}
