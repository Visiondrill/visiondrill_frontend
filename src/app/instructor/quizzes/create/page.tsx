'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Send, CheckCircle2, AlertCircle, Loader2, Sparkles, Image, FileText, LayoutList } from 'lucide-react';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function CreateCommandQuiz() {
  const router = useRouter();
  const [heading, setHeading] = useState('');
  const [questions, setQuestions] = useState<any[]>([
    { question: '', quiz_question_type_id: 1, answers: [{ answer: '', is_right: true }] }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdQuiz, setCreatedQuiz] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);

  const addQuestion = () => {
    setQuestions([...questions, { question: '', quiz_question_type_id: 1, answers: [{ answer: '', is_right: true }] }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const addAnswer = (qIdx: number) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].answers.push({ answer: '', is_right: false });
    setQuestions(newQuestions);
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].answers = newQuestions[qIdx].answers.filter((_: any, i: number) => i !== aIdx);
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    if (!heading) return alert('Enter a quiz title');
    setIsLoading(true);
    try {
      const res = await api.post('/instructor/quizzes/command', { heading, questions });
      setCreatedQuiz(res.data.quiz);
      setShowInviteModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to create quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      const res = await api.post(`/instructor/quizzes/${createdQuiz.id}/invite`, { email: inviteEmail });
      setInvitations([...invitations, res.data.invitation]);
      setInviteEmail('');
    } catch (err) {
      alert('Invitation failed');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-4">
           <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full tracking-widest uppercase">
              Command Feature
           </div>
           <span className="text-xs text-gray-400 font-bold italic">Bypassing Curriculum Constraints</span>
        </div>
        
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-10">
           Initialize New <br /><span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent italic">Tactical Drill.</span>
        </h1>

        <div className="space-y-8">
          {/* Quiz Header */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-20 bg-blue-50/50 blur-[50px] rounded-full -mr-10 -mt-10"></div>
             <div className="flex-1 relative z-10">
                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-4 block">DRILL IDENTIFICATION</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rapid Python Assessment - Cohort A" 
                  className="w-full text-3xl font-black text-gray-900 border-none outline-none placeholder:text-gray-100 bg-transparent"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                />
             </div>
             
             {/* AI PDF Uploader */}
             <div className="relative z-10">
                <label className="flex flex-col items-center justify-center px-6 py-4 bg-gray-900 hover:bg-black text-white rounded-3xl cursor-pointer transition-all border border-white/10 group">
                   <div className="flex items-center gap-3">
                      <FileText size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                         <p className="text-[10px] font-black tracking-widest uppercase">AUTO-GENERATE</p>
                         <p className="text-[9px] text-gray-400 font-bold">Upload PDF Document</p>
                      </div>
                   </div>
                   <input 
                     type="file" 
                     accept="application/pdf" 
                     className="hidden" 
                     onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file) return;
                       setIsLoading(true);
                       // Mocking AI Delay
                       setTimeout(() => {
                         setQuestions([
                           { 
                             question: 'Based on the uploaded document, what is the primary objective of the system architecture?', 
                             quiz_question_type_id: 1, 
                             answers: [
                               { answer: 'Scaling horizontal throughput', is_right: true },
                               { answer: 'Minimizing database latency', is_right: false },
                               { answer: 'Ensuring synchronous handshake', is_right: false }
                             ] 
                           },
                           { 
                             question: 'Explain the security implications mentioned in section 4.2 of the documentation.', 
                             quiz_question_type_id: 2, 
                             answers: [] 
                           }
                         ]);
                         setIsLoading(false);
                         alert('AI Intelligence: Quiz generated from PDF successfully.');
                       }, 2000);
                     }}
                   />
                </label>
             </div>
          </div>

          {/* Questions */}

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative group">
               <button 
                 onClick={() => removeQuestion(qIdx)}
                 className="absolute top-8 right-8 text-gray-200 hover:text-red-500 transition-colors"
               >
                  <Trash2 size={20} />
               </button>

               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center rounded-xl font-black text-xs">
                     {qIdx + 1}
                  </div>
                  <select 
                    className="bg-gray-50 border-none rounded-xl px-4 py-2 text-[10px] font-black text-gray-500 tracking-widest uppercase outline-none"
                    value={q.quiz_question_type_id}
                    onChange={(e) => {
                      const newQs = [...questions];
                      newQs[qIdx].quiz_question_type_id = parseInt(e.target.value);
                      setQuestions(newQs);
                    }}
                  >
                     <option value={1}>Multiple Choice</option>
                     <option value={2}>Direct Response</option>
                     <option value={3}>File Upload</option>
                  </select>
               </div>

               <textarea 
                 placeholder="Enter question text..."
                 className="w-full text-xl font-bold border-none outline-none bg-gray-50/50 p-6 rounded-2xl mb-6 placeholder:text-gray-200"
                 rows={2}
                 value={q.question}
                 onChange={(e) => {
                   const newQs = [...questions];
                   newQs[qIdx].question = e.target.value;
                   setQuestions(newQs);
                 }}
               />

               {q.quiz_question_type_id === 1 && (
                 <div className="space-y-3">
                    {q.answers.map((a: any, aIdx: number) => (
                      <div key={aIdx} className="flex items-center gap-3">
                         <button 
                           onClick={() => {
                             const newQs = [...questions];
                             newQs[qIdx].answers.forEach((ans: any) => ans.is_right = false);
                             newQs[qIdx].answers[aIdx].is_right = true;
                             setQuestions(newQs);
                           }}
                           className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${a.is_right ? 'bg-blue-600 border-blue-600' : 'border-gray-100'}`}
                         >
                            {a.is_right && <CheckCircle2 size={14} className="text-white" />}
                         </button>
                         <input 
                           type="text" 
                           placeholder="Answer text..."
                           className="flex-1 bg-gray-50 border-none rounded-xl px-5 py-3 text-sm font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all"
                           value={a.answer}
                           onChange={(e) => {
                             const newQs = [...questions];
                             newQs[qIdx].answers[aIdx].answer = e.target.value;
                             setQuestions(newQs);
                           }}
                         />
                         <button onClick={() => removeAnswer(qIdx, aIdx)} className="text-gray-200 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                         </button>
                      </div>
                    ))}
                    <button onClick={() => addAnswer(qIdx)} className="text-[10px] font-black text-blue-600 tracking-widest uppercase mt-4 flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
                       <Plus size={14} /> ADD RESPONSE OPTION
                    </button>
                 </div>
               )}

               {q.quiz_question_type_id === 2 && (
                 <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex items-center gap-4 text-gray-400">
                    <FileText size={20} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Direct Response Mode Engaged</span>
                 </div>
               )}

               {q.quiz_question_type_id === 3 && (
                 <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex items-center gap-4 text-gray-400">
                    <Image size={20} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Evidence Upload Mode Engaged</span>
                 </div>
               )}
            </div>
          ))}

          <button 
            onClick={addQuestion}
            className="w-full py-8 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex items-center justify-center gap-3 text-gray-400 hover:border-blue-200 hover:text-blue-500 transition-all font-black text-[10px] tracking-widest uppercase mb-10"
          >
             <Plus size={20} /> INITIALIZE NEXT MODULE
          </button>

          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="w-full py-6 bg-blue-950 text-white rounded-[2.5rem] font-black text-[11px] tracking-widest uppercase shadow-2xl shadow-blue-200 hover:bg-black transition-all"
          >
             {isLoading ? <Loader2 className="animate-spin inline mr-2" /> : <Sparkles className="inline mr-2" size={16} />} 
             DEPLOY DRILL SYSTEM
          </Button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-blue-50/30 blur-[100px] rounded-full -mr-20 -mt-20"></div>
              
              <div className="relative z-10 text-center mb-10">
                 <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                    <Send size={32} />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Fleet Mobilization</h2>
                 <p className="text-gray-400 font-medium text-sm mt-1">Generate strategic access tokens for invited participants.</p>
              </div>

              <div className="relative z-10 space-y-6">
                 <div className="relative">
                    <input 
                      type="email" 
                      placeholder="Enter student email..." 
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <button 
                      onClick={handleInvite}
                      disabled={isInviting}
                      className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white px-6 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-blue-600 transition-all"
                    >
                       {isInviting ? <Loader2 className="animate-spin" /> : 'ISSUE TOKEN'}
                    </button>
                 </div>

                 <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {invitations.map((inv, i) => (
                      <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-[10px]">
                               {i + 1}
                            </div>
                            <span className="text-xs font-bold text-gray-900">{inv.email}</span>
                         </div>
                         <button 
                           onClick={() => {
                             navigator.clipboard.writeText(`${window.location.origin}/drill/take/${inv.token}`);
                             alert('Copied to clipboard');
                           }}
                           className="text-[9px] font-black text-gray-400 hover:text-blue-600 tracking-widest uppercase"
                         >
                            COPY REFS
                         </button>
                      </div>
                    ))}
                 </div>

                 <div className="pt-8 border-t border-gray-50 flex gap-4">
                    <button 
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 py-4 text-[10px] font-black text-gray-400 tracking-widest uppercase"
                    >
                       FINISHED
                    </button>
                    <button 
                       onClick={() => router.push('/instructor/analytics')}
                       className="flex-1 py-4 bg-gray-100 text-gray-900 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-gray-200 transition-all"
                    >
                       VIEW STATS
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
