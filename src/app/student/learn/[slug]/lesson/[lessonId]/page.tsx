'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { 
  Play, 
  FileText, 
  Award, 
  MessageCircle, 
  Share2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export default function StudentLessonPage() {
  const { slug, lessonId } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    setIsLoading(true);
    api.get(`/courses/${slug}/lesson/${lessonId}`)
      .then(res => setLesson(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [lessonId, slug]);

  const handleMarkComplete = async () => {
    try {
      await api.post(`/student/lessons/${lessonId}/complete`);
      toast.success('Lesson marked as complete!');
      setLesson({ ...lesson, completed: true });
    } catch {
      toast.error('Failed to update progress.');
    }
  };

  if (isLoading) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-400">
       <Loader2 className="animate-spin" size={32} />
       <p className="font-semibold text-sm">Loading curriculum node...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Video / Resource Player */}
      <div className="aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl relative group mb-10">
         {lesson?.video_url ? (
            <video 
              src={lesson.video_url} 
              controls 
              className="w-full h-full object-cover"
            />
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <Play size={32} />
               </div>
               <p className="font-bold text-lg">No video media attached</p>
            </div>
         )}
      </div>

      {/* Lesson Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
         <div className="flex-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">{lesson?.lesson_title}</h1>
            <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                  <FileText size={14} /> Lesson module
               </div>
               {lesson?.completed && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                     <CheckCircle2 size={14} /> Performance verified
                  </div>
               )}
            </div>
         </div>
         <button 
           onClick={handleMarkComplete}
           disabled={lesson?.completed}
           className={`px-8 h-14 rounded-2xl font-bold flex items-center gap-3 transition-all ${
             lesson?.completed 
               ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' 
               : 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:scale-105 active:scale-95'
           }`}
         >
           <CheckCircle2 size={20} />
           {lesson?.completed ? 'Successfully completed' : 'Mark as complete'}
         </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-100 mb-8">
         <button 
           onClick={() => setActiveTab('content')}
           className={`pb-4 text-sm font-bold transition-all relative ${
             activeTab === 'content' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'
           }`}
         >
           Curriculum content
           {activeTab === 'content' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
         </button>
         <button 
           onClick={() => setActiveTab('resources')}
           className={`pb-4 text-sm font-bold transition-all relative ${
             activeTab === 'resources' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'
           }`}
         >
           Downloadable assets
           {activeTab === 'resources' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
         </button>
      </div>

      {/* Tab Content */}
      <div className="prose prose-blue max-w-none mb-20 text-gray-700 leading-relaxed">
         {activeTab === 'content' ? (
           <ReactMarkdown>{lesson?.description || 'No detailed content provided for this module.'}</ReactMarkdown>
         ) : (
           <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
              <p className="text-gray-400 font-medium italic">No auxiliary resources attached to this node.</p>
           </div>
         )}
      </div>
    </div>
  );
}
