'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { X, Plus, Trash2, CheckCircle2, Circle, Save, Loader2, HelpCircle, Video, FileUp } from 'lucide-react';
import Button from '@/components/Button';

interface Answer {
  id?: number;
  answer: string;
  is_right: boolean;
}

interface Question {
  id: number;
  question: string;
  type: string;
  answers: Answer[];
}

interface QuizInfo {
  id?: number;
  heading: string;
  description: string;
  duration: number;
  passing_score_percent?: number;
  max_attempts?: number;
  unlimited_time?: boolean;
}

interface QuizEditorProps {
  lessonId: number;
  courseId: number;
  onClose: () => void;
}

export default function QuizEditor({ lessonId, courseId, onClose }: QuizEditorProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizInfo, setQuizInfo] = useState<QuizInfo>({
    heading: '',
    description: '',
    duration: 30,
    passing_score_percent: 60,
    max_attempts: 1,
    unlimited_time: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [lessonId]);

  const fetchQuizData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Quiz Info
      const infoRes = await api.get(`/quiz-info/${lessonId}/show`);
      if (infoRes.data && infoRes.data.id) {
        setQuizInfo({
          id: infoRes.data.id,
          heading: infoRes.data.heading || '',
          description: infoRes.data.description || '',
          duration: infoRes.data.duration || 30,
          passing_score_percent: infoRes.data.passing_score_percent || 60,
          max_attempts: infoRes.data.max_attempts || 1,
          unlimited_time: !!infoRes.data.unlimited_time
        });
        setActiveTab('questions'); // If quiz exists, show questions by default
      }
      
      // 2. Fetch Questions
      const questionsRes = await api.get(`/instructor/quiz/${lessonId}/question`);
      const mapped = questionsRes.data.map((q: any) => ({
        id: q.id,
        question: q.question,
        type: q.questionType?.name || 'multiple_choice',
        answers: q.answers.map((a: any) => ({
          id: a.id,
          answer: a.answer,
          is_right: !!a.correct
        }))
      }));
      setQuestions(mapped);
    } catch (err) {
      console.error("Failed to fetch quiz data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuizInfo = async () => {
    setIsSaving(true);
    try {
      const res = await api.post(`/quiz-info/${lessonId}/create`, {
        heading: quizInfo.heading || 'Unit Quiz',
        description: quizInfo.description || 'Test your knowledge',
        duration: quizInfo.duration,
        passing_score_percent: quizInfo.passing_score_percent,
        max_attempts: quizInfo.max_attempts,
        unlimitedTime: quizInfo.unlimited_time ? 'true' : 'false'
      });
      setQuizInfo(prev => ({ ...prev, id: res.data.id }));
      setActiveTab('questions');
    } catch (err) {
      console.error("Failed to save quiz info", err);
      alert("Please fill in the Required fields (Title & Description)");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    try {
      const res = await api.post(`/instructor/quiz/${lessonId}/add-new-question`, { lesson_id: lessonId });
      const newQ: Question = {
        id: res.data.id,
        question: res.data.question,
        type: 'multiple_choice',
        answers: [
          { answer: 'Option 1', is_right: true },
          { answer: 'Option 2', is_right: false }
        ]
      };
      setQuestions([...questions, newQ]);
    } catch (err) {
      console.error("Failed to add question", err);
    }
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleUpdateAnswer = (qIndex: number, aIndex: number, field: string, value: any) => {
    const updated = [...questions];
    const updatedAnswers = [...updated[qIndex].answers];
    
    if (field === 'is_right' && value === true) {
      updatedAnswers.forEach((a, i) => a.is_right = i === aIndex);
    } else {
      updatedAnswers[aIndex] = { ...updatedAnswers[aIndex], [field]: value };
    }
    
    updated[qIndex] = { ...updated[qIndex], answers: updatedAnswers };
    setQuestions(updated);
  };

  const handleAddAnswer = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].answers.push({ answer: 'New Option', is_right: false });
    setQuestions(updated);
  };

  const handleRemoveAnswer = async (qIndex: number, aIndex: number) => {
    const answer = questions[qIndex].answers[aIndex];
    if (answer.id) {
       try {
         await api.delete(`/instructor/quiz/answer/${answer.id}`);
       } catch (err) {
         console.error("Failed to delete answer", err);
       }
    }
    const updated = [...questions];
    updated[qIndex].answers.splice(aIndex, 1);
    setQuestions(updated);
  };

  const handleSaveQuestion = async (qIndex: number) => {
    setIsSaving(true);
    try {
      const question = questions[qIndex];
      await api.post(`/instructor/quiz/${lessonId}/save-question`, {
        question: {
          id: question.id,
          question: question.question,
          type: question.type,
          answers: question.answers
        }
      });
      await fetchQuizData();
    } catch (err) {
      console.error("Failed to save question", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    try {
      await api.delete(`/instructor/quiz/question/${id}`);
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quiz Editor</h2>
              <p className="text-sm font-medium text-gray-400">Lesson #{lessonId} • {quizInfo.heading || 'Setup Quiz'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
               <button 
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 SETTINGS
               </button>
               <button 
                onClick={() => setActiveTab('questions')}
                className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${activeTab === 'questions' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 QUESTIONS
               </button>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400 ml-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 bg-gray-50/30">
          {isLoading ? (
             <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
             </div>
          ) : activeTab === 'settings' ? (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quiz Title *</label>
                  <input 
                    type="text" 
                    value={quizInfo.heading}
                    onChange={(e) => setQuizInfo({...quizInfo, heading: e.target.value})}
                    placeholder="e.g. Unit 1 Final Assessment"
                    className="w-full text-2xl font-black text-gray-900 bg-white border border-gray-100 rounded-3xl p-6 focus:ring-4 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all shadow-sm"
                  />
               </div>

               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Description</label>
                  <textarea 
                    rows={4}
                    value={quizInfo.description}
                    onChange={(e) => setQuizInfo({...quizInfo, description: e.target.value})}
                    placeholder="How should students prepare for this quiz?"
                    className="w-full text-lg font-medium text-gray-600 bg-white border border-gray-100 rounded-3xl p-6 focus:ring-4 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all shadow-sm"
                  />
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Time Limit (Min)</label>
                    <input 
                      type="number" 
                      value={quizInfo.duration}
                      onChange={(e) => setQuizInfo({...quizInfo, duration: parseInt(e.target.value)})}
                      className="w-full text-xl font-black text-gray-900 bg-white border border-gray-100 rounded-3xl p-6 focus:ring-4 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Passing Score (%)</label>
                    <input 
                      type="number" 
                      value={quizInfo.passing_score_percent}
                      onChange={(e) => setQuizInfo({...quizInfo, passing_score_percent: parseInt(e.target.value)})}
                      className="w-full text-xl font-black text-gray-900 bg-white border border-gray-100 rounded-3xl p-6 focus:ring-4 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all shadow-sm"
                    />
                  </div>
               </div>

               <div className="pt-6">
                  <Button 
                    onClick={handleSaveQuizInfo} 
                    disabled={isSaving}
                    className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-100 flex items-center justify-center gap-3 font-black tracking-widest"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {quizInfo.id ? 'SAVE & CONTINUE TO QUESTIONS' : 'CREATE QUIZ & ADD QUESTIONS'}
                  </Button>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {questions.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                   <HelpCircle className="mx-auto mb-4 text-gray-200" size={64} />
                   <h3 className="text-xl font-black text-gray-800 mb-2">No questions yet</h3>
                   <p className="text-gray-400 font-medium mb-8">Create a challenging quiz for your students.</p>
                   <Button onClick={handleAddQuestion} className="px-8 py-4">Add Your First Question</Button>
                </div>
              ) : (
                <>
                  {questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-8">
                         <div className="flex-grow max-w-2xl">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Question {qIndex + 1}</label>
                            <input 
                              type="text" 
                              value={q.question} 
                              onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                              placeholder="Enter your question here..."
                              className="w-full text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none transition-colors"
                            />
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => handleDeleteQuestion(q.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                               <Trash2 size={24} />
                            </button>
                         </div>
                      </div>

                      <div className="space-y-4 mb-10">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Answer Options</label>
                        {q.answers.map((a, aIndex) => (
                          <div key={aIndex} className="flex items-center gap-4 group/answer">
                            <button 
                              onClick={() => handleUpdateAnswer(qIndex, aIndex, 'is_right', !a.is_right)}
                              className={`flex-shrink-0 transition-transform active:scale-95 ${a.is_right ? 'text-emerald-500' : 'text-gray-200 hover:text-gray-300'}`}
                            >
                              {a.is_right ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                            </button>
                            <div className={`flex-grow flex items-center p-4 rounded-2xl border transition-all ${a.is_right ? 'bg-emerald-50/30 border-emerald-100' : 'bg-gray-50/50 border-gray-100 focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-50'}`}>
                              <input 
                                type="text" 
                                value={a.answer} 
                                onChange={(e) => handleUpdateAnswer(qIndex, aIndex, 'answer', e.target.value)}
                                className="w-full bg-transparent outline-none text-base font-bold text-gray-800"
                              />
                              <button onClick={() => handleRemoveAnswer(qIndex, aIndex)} className="opacity-0 group-hover/answer:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all">
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button 
                           onClick={() => handleAddAnswer(qIndex)}
                           className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 mt-4 ml-12 transition-colors uppercase tracking-widest"
                        >
                           <Plus size={16} /> Add Option
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                         <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                               <Video size={16} /> Hint Video
                            </button>
                            <button className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                               <FileUp size={16} /> Question File
                            </button>
                         </div>
                         <Button 
                            onClick={() => handleSaveQuestion(qIndex)} 
                            disabled={isSaving}
                            className="flex items-center gap-3 h-12 px-8 text-xs font-black tracking-widest"
                          >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                            SAVE QUESTION
                         </Button>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                     onClick={handleAddQuestion}
                     className="w-full py-10 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] text-gray-300 font-black tracking-[0.2em] text-xs hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/20 transition-all flex items-center justify-center gap-4 group uppercase"
                  >
                     <Plus size={28} className="group-hover:rotate-90 transition-transform" /> ADD ANOTHER QUESTION
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
             {questions.length} Question{questions.length !== 1 ? 's' : ''} • Passing: {quizInfo.passing_score_percent}%
          </p>
          <div className="flex gap-4">
            <Button onClick={onClose} className="px-8 border-none text-gray-400 bg-transparent hover:bg-gray-200 uppercase tracking-widest text-[10px] font-black">EXIT EDITOR</Button>
            <Button onClick={onClose} className="px-12 bg-gray-900 shadow-xl shadow-gray-200 text-white font-black tracking-widest text-xs h-12 rounded-2xl">DONE</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
