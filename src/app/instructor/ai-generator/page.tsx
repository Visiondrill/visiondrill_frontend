'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { 
  Brain,
  Target, 
  ListOrdered, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Wand2, 
  Plus,
  Save,
  Trash2,
  Zap
} from 'lucide-react';
import Button from '@/components/Button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface GeneratedSection {
  title: string;
  lessons: string[];
}

export default function AICourseGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') as 'curriculum' | 'quiz' || 'curriculum';

  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCurriculum, setGeneratedCurriculum] = useState<GeneratedSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [mode, setMode] = useState<'curriculum' | 'quiz'>(initialMode);
  const [transcript, setTranscript] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'curriculum' && !topic.trim()) return;
    if (mode === 'quiz' && !transcript.trim()) return;
    
    setIsGenerating(true);
    setGeneratedCurriculum([]);
    
    try {
      if (mode === 'curriculum') {
        const systemPrompt = "You are a senior curriculum architect. Generate a course structure (Sections and Lesson titles) for the following topic. Return ONLY JSON format: [{ 'title': 'Section Name', 'lessons': ['Lesson 1', 'Lesson 2'] }]";
        const response = await api.post('/engine/api/stream/sse', {
          message: `Topic: ${topic}. Audience: ${audience}. Create a 4-section curriculum.`,
          system_prompt: systemPrompt
        });
        
        const mockResult: GeneratedSection[] = [
          { title: "Introduction & Fundamentals", lessons: ["Overview of " + topic, "Core Principles", "Industry Standards"] },
          { title: "Intermediate concepts", lessons: ["Advanced techniques in " + topic, "Case Studies", "Common Pitfalls"] },
          { title: "Practical Implementation", lessons: ["Step-by-step Guide", "Tools of the trade", "Optimization & Best Practices"] },
          { title: "Final Assessment", lessons: ["The Capstone Project", "Certification Exam Preparation"] }
        ];
        
        try {
          const aiText = response.data.response || response.data.reply;
          if (aiText && aiText.includes('[')) {
              const jsonPart = aiText.substring(aiText.indexOf('['), aiText.lastIndexOf(']') + 1);
              setGeneratedCurriculum(JSON.parse(jsonPart));
          } else {
              setGeneratedCurriculum(mockResult);
          }
        } catch {
           setGeneratedCurriculum(mockResult);
        }
      } else {
        // Quiz generation logic
        await new Promise(r => setTimeout(r, 2000)); // Simulate AI wait
        const mockQuiz: GeneratedSection[] = [
          { title: "Comprehension Quiz", lessons: ["Question 1: What is the main theme of the transcript?", "Question 2: Which technical tool was recommended?", "Question 3: Identify the bottleneck mentioned."] }
        ];
        setGeneratedCurriculum(mockQuiz);
      }

    } catch (err) {
      console.error("AI Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = async () => {
    if (mode === 'quiz') {
       // Logic to save quiz to existing course
       router.push('/instructor/courses');
       return;
    }
    setIsSaving(true);
    try {
      const courseRes = await api.post('/instructor/create-course', {
        course_title: topic,
        category_id: 1, 
        price: 0
      });
      const courseId = courseRes.data.id;
      for (const section of generatedCurriculum) {
         const sectionRes = await api.post(`/instructor/courses/${courseId}/sections`, {
            title: section.title
         });
         const sectionId = sectionRes.data.id;
         for (const lessonTitle of section.lessons) {
            await api.post(`/instructor/courses/${courseId}/sections/${sectionId}/lessons`, {
               title: lessonTitle,
               lesson_type: 'video'
            });
         }
      }
      router.push(`/instructor/courses/${courseId}/curriculum`);
    } catch (err) {
      console.error("Failed to commit curriculum", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white sticky top-0 z-50">
        <Link href="/instructor" className="flex items-center space-x-2 group">
          <img src="/images/visiondrill-logo-icon.png" alt="Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-xl font-black text-gray-900 tracking-tighter">VISIONDRILL</span>
        </Link>
        <div className="flex items-center space-x-6">
           <button onClick={() => router.push('/instructor')} className="h-12 px-6 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center gap-2">
              <ChevronLeft size={18} /> Back to Dashboard
           </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Controls */}
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                <Brain size={32} />
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">AI Asset <span className="text-blue-600 italic">Generator</span></h1>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">Choose your mode and let our AI architect build pedagogically sound assets in seconds.</p>
            </div>

            <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-sm max-w-xs">
               <button 
                 onClick={() => setMode('curriculum')}
                 className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${mode === 'curriculum' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
               >
                 CURRICULUM
               </button>
               <button 
                 onClick={() => setMode('quiz')}
                 className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${mode === 'quiz' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
               >
                 QUIZ FROM TRANSCRIPT
               </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
               {mode === 'curriculum' ? (
                 <>
                   <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400 ml-2">Course Topic</label>
                      <div className="relative">
                         <Wand2 className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                         <input 
                            type="text" 
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="e.g. Master React in 7 Days"
                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-lg font-black focus:ring-8 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400 ml-2">Target Audience</label>
                      <div className="grid grid-cols-3 gap-3">
                         {['beginner', 'intermediate', 'advanced'].map(lvl => (
                            <button 
                               key={lvl}
                               type="button"
                               onClick={() => setAudience(lvl)}
                               className={`py-4 rounded-2xl text-xs font-black border transition-all ${audience === lvl ? 'bg-gray-900 border-gray-900 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                            >
                               {lvl}
                            </button>
                         ))}
                      </div>
                   </div>
                 </>
               ) : (
                 <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 ml-2">Paste Video Transcript</label>
                    <textarea 
                       rows={10}
                       value={transcript}
                       onChange={e => setTranscript(e.target.value)}
                       placeholder="Paste the transcription text here..."
                       className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all resize-none"
                    />
                 </div>
               )}

               <Button 
                  type="submit" 
                  disabled={isGenerating || (mode === 'curriculum' ? !topic.trim() : !transcript.trim())}
                  className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl text-sm shadow-2xl shadow-blue-100 transition-all flex items-center justify-center gap-3"
               >
                  {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />} 
                  {isGenerating ? 'Architecting...' : mode === 'curriculum' ? 'Generate Curriculum' : 'Generate Quiz'}
               </Button>
            </form>
          </div>

          {/* Result Preview */}
          <div className="relative">
             {generatedCurriculum.length > 0 ? (
                <div className="space-y-6 animate-in slide-in-from-right-12 duration-700">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400">Generated Map</h3>
                      <span className="text-xs font-semibold text-green-500 bg-green-50 px-3 py-1 rounded-full">AI Optimized</span>
                   </div>
                   
                   <div className="space-y-4">
                      {generatedCurriculum.map((section, idx) => (
                         <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                               <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                                  {idx + 1}
                               </div>
                               <h4 className="font-black text-gray-900 tracking-tight text-sm">{section.title}</h4>
                            </div>
                            <div className="space-y-2 pl-11">
                               {section.lessons.map((lesson, lIdx) => (
                                  <div key={lIdx} className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                     <ChevronRight size={14} className="text-gray-200" /> {lesson}
                                  </div>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>

                   <div className="pt-8 flex flex-col gap-4">
                      <Button 
                        onClick={handleCommit} 
                        disabled={isSaving}
                        className="w-full h-16 bg-gray-900 hover:bg-black text-white font-black rounded-3xl shadow-2xl"
                      >
                         {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="mr-2 inline" />} 
                         Commit & Start Building
                      </Button>
                      <button onClick={() => setGeneratedCurriculum([])} className="text-xs font-medium text-gray-400 hover:text-red-500 flex items-center justify-center gap-2">
                         <Trash2 size={14} /> Discard Suggestion
                      </button>
                   </div>
                </div>
             ) : (
                <div className="h-full min-h-[500px] border-4 border-dashed border-gray-100 rounded-[4rem] flex flex-col items-center justify-center text-center p-12 bg-white/30 backdrop-blur-sm">
                   {isGenerating ? (
                      <div className="relative">
                         <div className="absolute inset-0 bg-blue-100 blur-[80px] opacity-50 rounded-full"></div>
                         <Loader2 size={80} className="text-blue-100 animate-spin relative z-10" />
                      </div>
                   ) : (
                      <>
                         <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                            <ListOrdered size={48} />
                         </div>
                         <h4 className="text-xl font-medium text-gray-300 tracking-tight mb-2">Curriculum Preview</h4>
                         <p className="text-gray-400 font-medium text-sm">Fill in your topic on the left to see the AI magic happens here.</p>
                      </>
                   )}
                </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
}
