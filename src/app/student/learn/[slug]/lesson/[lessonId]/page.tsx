'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Play, 
  FileText, 
  Award, 
  MessageCircle, 
  Share2,
  CheckCircle2,
  Loader2,
  Download,
  Eye,
  ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const STORAGE_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || '';

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

  const getDocumentUrl = (documentUrl: string | null): string | null => {
    if (!documentUrl) return null;
    if (documentUrl.startsWith('http')) return documentUrl;
    return `${STORAGE_ROOT}/uploads/lessons/documents/${documentUrl}`;
  };

  const isDocumentPreviewable = (documentUrl: string | null): boolean => {
    if (!documentUrl) return false;
    const ext = documentUrl.split('.').pop()?.toLowerCase() || '';
    return ['pdf', 'txt'].includes(ext);
  };

  if (isLoading) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-400">
       <Loader2 className="animate-spin" size={32} />
       <p className="font-semibold text-sm">Loading curriculum node...</p>
    </div>
  );

  const documentUrl = lesson?.document_url || lesson?.content?.document_url || null;
  const fullDocUrl = getDocumentUrl(documentUrl);
  const hasResource = !!documentUrl;
  const hasContent = !!lesson?.description || !!lesson?.content?.body;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Video / Resource / Quiz Player */}
      <div className="aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl relative group mb-10 transition-all">
         {lesson?.lesson_type === 'quiz' || lesson?.quiz ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 text-white gap-8 p-10 text-center">
               <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30 shadow-2xl animate-pulse">
                  <Award size={40} className="text-blue-400" />
               </div>
               <div className="max-w-md">
                  <h2 className="text-3xl font-black tracking-tight mb-2 italic">Knowledge Drill Ready</h2>
                  <p className="text-sm font-medium text-blue-100/60 mb-8">
                    Validate your mastery of this module. Complete the assessment to verify your performance and earn progress.
                  </p>
                  <Link href={`/student/quizzes/${lesson?.quiz?.id || lesson?.quiz_id}/take`}>
                    <button className="px-10 h-16 bg-blue-600 text-white rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                       Begin Assessment
                    </button>
                  </Link>
               </div>
            </div>
         ) : lesson?.video_url ? (
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
           {hasResource && (
             <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
           )}
           {activeTab === 'resources' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
         </button>
      </div>

      {/* Tab Content */}
      <div className="prose prose-blue max-w-none mb-20 text-gray-700 leading-relaxed">
         {activeTab === 'content' ? (
            hasContent ? (
              <ReactMarkdown>{lesson?.description || lesson?.content?.body || ''}</ReactMarkdown>
            ) : (
              <div className="py-12 text-center">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-gray-300" />
                 </div>
                 <p className="text-gray-400 font-medium italic">No detailed content provided for this module.</p>
              </div>
            )
         ) : (
            <div>
              {hasResource ? (
                <div className="space-y-6">
                  <div className="p-8 bg-blue-50/30 border border-blue-100 rounded-[2rem]">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <FileText className="text-blue-600" size={28} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">
                          {documentUrl.split('/').pop()}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium mb-1">
                          Reference document for this lesson
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-6">
                          {documentUrl.split('.').pop()?.toUpperCase()} Document
                        </p>
                        <div className="flex items-center gap-3">
                          <a
                            href={fullDocUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                          >
                            {isDocumentPreviewable(documentUrl) ? (
                              <><Eye size={16} /> Preview Document</>
                            ) : (
                              <><Download size={16} /> Download</>
                            )}
                          </a>
                          <a
                            href={fullDocUrl || '#'}
                            download
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-black tracking-widest hover:bg-blue-50 transition-all"
                          >
                            <Download size={16} /> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download size={24} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium italic">No auxiliary resources attached to this node.</p>
                  <p className="text-[10px] text-gray-300 font-bold mt-2 tracking-widest uppercase">
                    The instructor may add documents later
                  </p>
                </div>
              )}
            </div>
         )}
      </div>
    </div>
  );
}