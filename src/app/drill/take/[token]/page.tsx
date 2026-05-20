'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, Sparkles, AlertTriangle, ShieldCheck, Clock, Send } from 'lucide-react';
import Button from '@/components/Button';

export default function TakePublicQuiz() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/public/quiz/${token}`);
        setData(res.data);
      } catch (err) {
        setError('Invalid or expired invitation token.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
  }, [token]);

  const handleAnswer = (questionId: number, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Basic score calculation for MCQs on frontend for immediate feedback
      let correct = 0;
      data.quiz.quiz_questions.forEach((q: any) => {
        if (q.quiz_question_type_id === 1) {
          const selectedAnswerId = answers[q.id];
          const rightAnswer = q.answers.find((a: any) => a.correct === 1);
          if (rightAnswer && rightAnswer.id === selectedAnswerId) correct++;
        }
      });
      const score = (correct / data.quiz.quiz_questions.length) * 100;

      await api.post(`/public/quiz/${token}/submit`, { answers, score });
      setSubmitted(true);
    } catch (err) {
      alert('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50">Validating Strategic Access...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-12 text-center">
         <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
            <ShieldCheck size={48} />
         </div>
         <h1 className="text-4xl font-black tracking-tighter mb-4">Access Denied.</h1>
         <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">{error || "This drill identification has expired or been decommissioned."}</p>
         <button onClick={() => window.location.reload()} className="mt-10 text-[10px] font-black text-blue-500 tracking-widest uppercase">RE-INITIATE HANDSHAKE</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-12 text-center animate-in zoom-in duration-500">
         <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/20">
            <CheckCircle2 size={48} />
         </div>
         <h1 className="text-5xl font-black tracking-tighter mb-6 italic">Drill Completed.</h1>
         <p className="text-gray-400 font-medium text-lg mb-10">Your response has been synchronized with the instructor's command console.</p>
         <div className="px-10 py-6 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl">
            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">SYSTEM IDENTIFIER</p>
            <p className="font-mono text-blue-400 text-sm">{token}</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-2xl border-b border-white/5 px-8 py-6">
         <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Sparkles size={20} />
               </div>
               <div>
                  <p className="text-[9px] font-black text-gray-500 tracking-widest uppercase">TACTICAL ASSESSMENT</p>
                  <p className="text-lg font-black tracking-tight">{data.quiz.heading}</p>
               </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10">
               <Clock size={16} className="text-blue-400" />
               <span className="text-[10px] font-black tracking-widest uppercase">Session Live</span>
            </div>
         </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-20">
         <div className="space-y-12">
            {data.quiz.quiz_questions.map((q: any, idx: number) => (
              <div key={q.id} className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] relative group hover:border-blue-500/30 transition-all">
                 <div className="absolute -top-6 left-12 w-12 h-12 bg-gray-900 border border-white/10 flex items-center justify-center rounded-2xl font-black text-lg">
                    {idx + 1}
                 </div>
                 
                 <h3 className="text-2xl font-bold mb-10 leading-tight pt-2">{q.question}</h3>

                 {q.quiz_question_type_id === 1 && (
                    <div className="grid grid-cols-1 gap-4">
                       {q.answers.map((a: any) => (
                          <button 
                             key={a.id}
                             onClick={() => handleAnswer(q.id, a.id)}
                             className={`text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between group/opt ${
                                answers[q.id] === a.id 
                                ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-600/10' 
                                : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                             }`}
                          >
                             <span className={`font-bold transition-colors ${answers[q.id] === a.id ? 'text-white' : 'text-gray-400 group-hover/opt:text-white'}`}>
                                {a.answer}
                             </span>
                             {answers[q.id] === a.id && <ShieldCheck size={20} className="text-white" />}
                          </button>
                       ))}
                    </div>
                 )}

                 {q.quiz_question_type_id === 2 && (
                    <textarea 
                       placeholder="Technical response input..."
                       className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-8 text-lg font-medium outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all min-h-[200px]"
                       onChange={(e) => handleAnswer(q.id, e.target.value)}
                    />
                 )}

                 {q.quiz_question_type_id === 3 && (
                    <div className="relative h-64 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center group/upload hover:border-blue-600 transition-all cursor-pointer bg-white/5 overflow-hidden">
                       <input 
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                         onChange={(e) => handleAnswer(q.id, e.target.files?.[0])}
                       />
                       <div className="text-center group-hover/upload:scale-110 transition-transform">
                          <CheckCircle2 size={40} className="mx-auto mb-4 text-blue-500 opacity-50" />
                          <p className="text-[10px] font-black tracking-widest uppercase text-gray-500">Secure Artifact Upload</p>
                          <p className="text-xs text-gray-700 mt-2">Dnd or Browse System File</p>
                       </div>
                       {answers[q.id] && (
                          <div className="absolute bottom-6 left-6 right-6 bg-blue-600 rounded-2xl px-6 py-3 flex justify-between items-center">
                             <span className="text-[10px] font-black uppercase tracking-widest truncate">{answers[q.id].name}</span>
                             <ShieldCheck size={16} />
                          </div>
                       )}
                    </div>
                 )}
              </div>
            ))}

            <div className="pt-10 flex flex-col items-center">
               <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full max-w-sm py-8 bg-blue-600 hover:bg-black text-white rounded-[2.5rem] font-black text-xs tracking-[0.2em] uppercase shadow-2xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
               >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : (
                     <div className="flex items-center justify-center gap-3">
                        SUBMIT DRILL RESPONSE <Send size={16} />
                     </div>
                  )}
               </button>
               <p className="mt-8 text-[10px] font-black text-gray-600 tracking-widest uppercase">End of Assessment • VisionDrill v4.0</p>
            </div>
         </div>
      </main>
    </div>
  );
}
