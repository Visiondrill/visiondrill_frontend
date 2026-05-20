'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Section, Lesson, Course } from '@/types/curriculum';
import LearnSidebar from '@/components/LearnSidebar';
import AIAssistantSidebar from '@/components/AIAssistantSidebar';
import { Loader2, Play, ChevronLeft, ChevronRight, Menu, Brain, Volume2, Maximize, Settings, FileText } from 'lucide-react';

import Link from 'next/link';

export default function LearnPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'curriculum' | 'cohort'>('curriculum');
  const [cohortData, setCohortData] = useState<any>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const [courseRes, cohortRes] = await Promise.all([
          api.get(`/courses/${slug}`),
          api.get(`/student/courses/${slug}/cohort`).catch(() => ({ data: null }))
        ]);

        setCourse(courseRes.data);
        setCohortData(cohortRes.data);
        
        // Handle initial lesson selection
        const lessonFromUrl = searchParams.get('lesson');
        if (lessonFromUrl) {
          setActiveLessonId(parseInt(lessonFromUrl));
        } else if (courseRes.data.sections?.[0]?.lessons?.[0]) {
          setActiveLessonId(courseRes.data.sections[0].lessons[0].id);
        }
      } catch (err) {
        console.error("Failed to load course for player", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [slug, searchParams]);

  const activeLesson = useMemo(() => {
    if (!course || !activeLessonId) return null;
    for (const section of course.sections) {
      const lesson = section.lessons.find(l => l.id === activeLessonId);
      if (lesson) return lesson;
    }
    return null;
  }, [course, activeLessonId]);

  const handleLessonChange = (id: number) => {
    setActiveLessonId(id);
    router.push(`/courses/${slug}/learn?lesson=${id}`);
  };

  const handleCheckIn = async () => {
    try {
      const response = await api.post(`/student/courses/${course?.id}/attendance`);
      if (response.data.zoom_link) {
        window.open(response.data.zoom_link, '_blank');
      }
      alert("Attendance marked! Redirecting to live session...");
    } catch (err) {
      alert("No active live session found for this course.");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-sm font-black  tracking-widest animate-pulse">Initializing Vision Engine...</p>
      </div>
    );
  }

  if (!course) return <div className="h-screen flex items-center justify-center">Course not found.</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Top Header */}
      <nav className="h-14 bg-black border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
           <Link href="/" className="hover:rotate-12 transition-transform">
              <img src="/images/visiondrill-logo-icon.png" alt="VisionDrill" className="w-8 h-8 object-contain" />
           </Link>
           <div className="h-6 w-px bg-white/10"></div>
           <Link href={`/courses/${slug}`} className="text-white/60 hover:text-white transition-colors">
             <ChevronLeft size={20} />
           </Link>
           <div className="h-6 w-px bg-white/10"></div>
           <h1 className="text-xs font-black text-white  tracking-widest truncate max-w-md">
             {course.course_title} <span className="text-white/40 mx-2">/</span> <span className="text-blue-400">{activeLesson?.title}</span>
           </h1>
        </div>
        <div className="flex items-center gap-6">
           <button 
             onClick={handleCheckIn}
             className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-full text-[10px] font-black  tracking-widest hover:bg-green-700 transition-all border border-green-500 shadow-lg shadow-green-900/20"
           >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Live Session
           </button>
           <button onClick={() => setIsAIChatOpen(!isAIChatOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black  tracking-widest transition-all ${isAIChatOpen ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              <Brain size={14} /> AI Assistant
           </button>
        </div>
      </nav>

      <div className="flex flex-grow overflow-hidden">
        {/* Navigation Sidebar */}
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden shrink-0 bg-white flex flex-col`}>
          <div className="flex border-b border-gray-100 shrink-0">
             <button 
                onClick={() => setActiveSidebarTab('curriculum')}
                className={`flex-1 py-4 text-[10px] font-black  tracking-widest transition-all ${activeSidebarTab === 'curriculum' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
             >
                Curriculum
             </button>
             <button 
                onClick={() => setActiveSidebarTab('cohort')}
                className={`flex-1 py-4 text-[10px] font-black  tracking-widest transition-all ${activeSidebarTab === 'cohort' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
             >
                My Cohort
             </button>
          </div>
          <div className="flex-grow overflow-hidden flex flex-col">
            {activeSidebarTab === 'curriculum' ? (
              <LearnSidebar 
                sections={course.sections} 
                activeLessonId={activeLessonId!} 
                onLessonSelect={handleLessonChange} 
              />
            ) : (
              <div className="p-8 flex flex-col h-full bg-white">
                 {cohortData ? (
                   <div className="flex flex-col h-full">
                      <div className="mb-8">
                         <span className="text-[10px] font-black text-blue-600  tracking-widest mb-2 block">Assigned Group</span>
                         <h3 className="text-xl font-black text-gray-900 tracking-tighter ">{cohortData.group.name}</h3>
                      </div>
                      
                      <div className="flex-grow overflow-y-auto no-scrollbar space-y-4">
                         <span className="text-[10px] font-black text-gray-400  tracking-widest block mb-4">Team Members ({cohortData.members.length})</span>
                         {cohortData.members.map((member: any) => (
                            <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                               <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs ">
                                  {member.student.name.substring(0, 2)}
                               </div>
                               <div className="flex-grow min-w-0">
                                  <p className="text-[12px] font-black text-gray-900 truncate  tracking-tighter">{member.student.name}</p>
                                  {member.is_leader && (
                                    <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full  tracking-widest mt-1 inline-block">Team Leader</span>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                      
                      <div className="mt-auto pt-8 border-t border-gray-100">
                         <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black  text-[10px] tracking-widest hover:bg-black transition-all">
                            Broadcast Message
                         </button>
                      </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-6">
                         <Menu size={32} />
                      </div>
                      <h4 className="text-sm font-black text-gray-900  tracking-widest mb-4">Solo Learning Mode</h4>
                      <p className="text-[11px] font-medium text-gray-400 leading-relaxed  tracking-tight">You are not currently assigned to a group for this course.</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Main Player View */}
        <main className="flex-grow flex flex-col bg-gray-950 relative">
           <div className="flex-grow flex items-center justify-center">
             {activeLesson?.content?.content_type === 'video' ? (
                <div className="w-full h-full max-h-[calc(100vh-12rem)] aspect-video bg-black relative group shadow-2xl">

                   {/* Placeholder for real Video Player (e.g. Video.js or Youtube embed) */}
                   {activeLesson?.content?.video_url?.includes('youtube.com') || activeLesson?.content?.video_url?.includes('youtu.be') ? (
                      <iframe 
                        src={`https://www.youtube.com/embed/${activeLesson?.content?.video_url?.split('v=')[1] || activeLesson?.content?.video_url?.split('/')?.pop() || ''}`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                   ) : (
                      <div className="w-full h-full">
                        {activeLesson?.content?.video_url && (
                          <video 
                            src={activeLesson?.content?.video_url?.startsWith('http') ? activeLesson?.content?.video_url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/videos/${activeLesson?.content?.video_url}`}
                            controls 
                            className="w-full h-full object-contain"
                          />

                        )}
                      </div>

                   )}
                   
                   {/* Player Overlay Controls (Visual Only) */}
                   <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                      <div className="flex items-center gap-6">
                         <Play className="text-white cursor-pointer" size={20} />
                         <Volume2 className="text-white cursor-pointer" size={20} />
                         <span className="text-xs text-white/80 font-bold  tracking-widest">00:00 / 12:45</span>
                      </div>
                      <div className="flex items-center gap-6">
                         <Settings className="text-white cursor-pointer" size={20} />
                         <Maximize className="text-white cursor-pointer" size={20} />
                      </div>
                   </div>
                </div>
             ) : activeLesson?.content?.lesson_type === 'quiz' ? (
                <div className="max-w-2xl w-full bg-white rounded-[2rem] p-12 text-center shadow-2xl">
                   <Brain className="mx-auto mb-6 text-blue-600" size={64} />
                   <h2 className="text-2xl font-black text-gray-900  mb-4">{activeLesson.title}</h2>
                   <p className="text-gray-500 font-medium mb-10 leading-relaxed">This lesson is an interactive quiz designed to test your knowledge of the previous concepts.</p>
                   <button className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl  tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">Start Knowledge Drill</button>
                </div>
              ) : activeLesson?.content?.content_type === 'article' || activeLesson?.content?.body || activeLesson?.content?.document_url ? (
                <div className="max-w-4xl w-full h-[calc(100vh-8rem)] overflow-y-auto px-8 md:px-16 py-16 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl mt-8 animate-in fade-in slide-in-from-bottom-4">
                   <div className="mb-10 pb-10 border-b border-gray-50">
                      <div className="flex items-center gap-2 mb-4">
                         <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full  tracking-widest uppercase">Reading Material</span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none">{activeLesson?.title}</h2>
                   </div>

                   {/* Main Body Text */}
                   <div className="prose prose-lg prose-blue max-w-none font-medium leading-relaxed text-gray-700 min-h-[200px]" 
                      dangerouslySetInnerHTML={{ __html: activeLesson?.content?.body || 'No text content provided for this lesson.' }} 
                   />

                   {/* Attached Documents */}
                   {activeLesson?.content?.document_url && (
                      <div className="mt-16 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                               <FileText className="text-gray-400" size={28} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-gray-400  tracking-widest uppercase mb-1">Attached Reference</p>
                               <p className="text-sm font-bold text-gray-900 ">{activeLesson.content.document_url}</p>
                            </div>
                         </div>
                         <a 
                           href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/uploads/lessons/documents/${activeLesson.content.document_url}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-[10px]  tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                         >
                            Download Document
                         </a>
                      </div>
                   )}
                </div>
              ) : (
                <div className="max-w-2xl w-full bg-white rounded-[2rem] p-12 text-center shadow-2xl">
                   <Play className="mx-auto mb-6 text-gray-200" size={64} />
                   <h2 className="text-2xl font-black text-gray-900  mb-4">Empty Lesson</h2>
                   <p className="text-gray-500 font-medium leading-relaxed">No content has been deployed to this lesson yet.</p>
                </div>
             )}
           </div>

           {/* Lesson Footer Navigation */}
           <div className="h-16 bg-black border-t border-white/5 px-12 flex items-center justify-between shrink-0">
              <button 
                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                 className="p-2 text-white/40 hover:text-white transition-colors"
              >
                 <Menu size={20} />
              </button>
              
              <div className="flex items-center gap-4">
                 <button className="flex items-center gap-2 px-6 py-2 bg-white/5 text-white/40 rounded-xl font-black  text-[10px] tracking-widest hover:bg-white/10 transition-all">
                    <ChevronLeft size={16} /> Previous
                 </button>
                 <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-black  text-[10px] tracking-widest hover:bg-blue-700 transition-all">
                    Next Lesson <ChevronRight size={16} />
                 </button>
              </div>

              <div className="w-10"></div>
           </div>
        </main>

        {/* AI Sidebar */}
        <div className={`${isAIChatOpen ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden shrink-0`}>
          {activeLessonId && (
            <AIAssistantSidebar 
              lessonId={activeLessonId} 
              courseId={course.id} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
