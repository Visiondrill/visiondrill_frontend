'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import type { QuizQuestion, QuizConfiguration, QuizInvitation, StudentResult } from '@/types/quiz';
import {
  Plus, Trash2, Send, CheckCircle2, Loader2, Save, Clock, Users,
  UserCheck, Mail, Copy, ExternalLink, Eye, Settings, ListChecks,
  AlertCircle, FileText, Image, ChevronLeft, ChevronRight, Timer,
  Target, Infinity, Link2, UserPlus, X, Search, Filter, Sparkles
} from 'lucide-react';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

// ─── Constants ───────────────────────────────────────────────────────
const STEPS = ['Configuration', 'Questions', 'Distribute'] as const;
type Step = typeof STEPS[number];

const DEFAULT_CONFIG: QuizConfiguration = {
  heading: '',
  description: '',
  time_limit_minutes: 30,
  unlimited_time: false,
  group_mode: false,
  only_leader_submit: false,
  passing_score_percent: 60,
  max_attempts: 1,
};

// ─── Main Component ──────────────────────────────────────────────────
export default function CreateCommandQuiz() {
  const router = useRouter();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('Configuration');
  const currentStepIdx = STEPS.indexOf(currentStep);

  // Quiz meta
  const [config, setConfig] = useState<QuizConfiguration>(DEFAULT_CONFIG);
  const [createdQuizId, setCreatedQuizId] = useState<number | null>(null);

  // Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: '', quiz_question_type_id: 1, points: 10, answers: [{ answer: '', is_right: true }] }
  ]);

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Distribution State ──────────────────────────────────────────
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [invitations, setInvitations] = useState<QuizInvitation[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [singleEmail, setSingleEmail] = useState('');

  // ─── Results ──────────────────────────────────────────────────────
  const [results, setResults] = useState<StudentResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // ─── Question Handlers ────────────────────────────────────────────
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { question: '', quiz_question_type_id: 1, points: 10, answers: [{ answer: '', is_right: true }] }
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };

      // Reset answers when switching from MCQ
      if (field === 'quiz_question_type_id' && value !== 1) {
        copy[idx].answers = [];
      }
      // Ensure at least one answer for MCQ
      if (field === 'quiz_question_type_id' && value === 1 && copy[idx].answers.length === 0) {
        copy[idx].answers = [{ answer: '', is_right: true }];
      }
      return copy;
    });
  };

  const addAnswer = (qIdx: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].answers.push({ answer: '', is_right: false });
      return copy;
    });
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      if (copy[qIdx].answers.length <= 1) return prev;
      copy[qIdx].answers = copy[qIdx].answers.filter((_, i) => i !== aIdx);
      return copy;
    });
  };

  const setCorrectAnswer = (qIdx: number, aIdx: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].answers = copy[qIdx].answers.map((a, i) => ({
        ...a,
        is_right: i === aIdx,
      }));
      return copy;
    });
  };

  const updateAnswer = (qIdx: number, aIdx: number, value: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].answers[aIdx].answer = value;
      return copy;
    });
  };

  // ─── Config Handlers ──────────────────────────────────────────────
  const updateConfig = (field: keyof QuizConfiguration, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // ─── Create / Save Quiz ──────────────────────────────────────────
  const handleCreateQuiz = async () => {
    if (!config.heading.trim()) {
      setError('Please enter a quiz title.');
      return;
    }

    // Questions validation only happens if questions are actually present
    // OR from the Questions step. We skip it during initial creation to allow "Save & Build"
    const validationQuestions = questions.filter(q => q.quiz_question_type_id === 1 && q.question.trim());
    
    // If no questions have text yet, we allow creation (they are just starting)
    // If they HAVE entered some text, then we perform full validation
    const hasStartedQuestions = questions.some(q => q.question.trim());

    if (hasStartedQuestions) {
      for (const q of questions.filter(curr => curr.quiz_question_type_id === 1)) {
        if (!q.question.trim()) {
           setError('All multiple-choice questions must have text.');
           return;
        }
        if (q.answers.length < 2) {
          setError('All multiple-choice questions need at least 2 answers.');
          return;
        }
        if (!q.answers.some(a => a.is_right)) {
          setError('Each multiple-choice question must have a correct answer selected.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        heading: config.heading,
        description: config.description || '',
        time_limit_minutes: config.unlimited_time ? null : config.time_limit_minutes,
        unlimited_time: config.unlimited_time,
        group_mode: config.group_mode,
        only_leader_submit: config.only_leader_submit,
        passing_score_percent: config.passing_score_percent,
        max_attempts: config.max_attempts,
        questions: questions.map(q => ({
          question: q.question,
          quiz_question_type_id: q.quiz_question_type_id,
          points: q.points || 10,
          answers: q.quiz_question_type_id === 1 ? q.answers.map(a => ({
            answer: a.answer,
            is_right: a.is_right,
          })) : [],
        })),
      };

      const res = await api.post('/quiz-info/create', payload);
      const quizId = res.data.quiz?.id || res.data.id;
      setCreatedQuizId(quizId);
      setSuccessMsg('Quiz created successfully! You can now distribute it.');
      setCurrentStep('Distribute');
      // Automatically fetch students for distribution
      fetchStudents();
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuestions = async () => {
    if (!createdQuizId) return;

    const mcqQuestions = questions.filter(q => q.quiz_question_type_id === 1);
    for (const q of mcqQuestions) {
      if (!q.question.trim()) {
        setError('All multiple-choice questions must have text.');
        return;
      }
      if (q.answers.length < 2) {
        setError('All multiple-choice questions need at least 2 answers.');
        return;
      }
      if (!q.answers.some(a => a.is_right)) {
        setError('Each multiple-choice question must have a correct answer selected.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Update quiz configuration via PUT endpoint
      await api.put(`/quiz-info/${createdQuizId}`, {
        heading: config.heading,
        description: config.description || '',
        time_limit_minutes: config.unlimited_time ? null : config.time_limit_minutes,
        unlimited_time: config.unlimited_time,
        group_mode: config.group_mode,
        only_leader_submit: config.only_leader_submit,
        passing_score_percent: config.passing_score_percent,
        max_attempts: config.max_attempts,
        status: 'active',
      });
      setSuccessMsg('Quiz updated successfully!');
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Failed to update quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Student Fetching ─────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const coursesRes = await api.get('/instructor/courses');
      const courses: any[] = coursesRes.data;
      const allStudents: any[] = [];
      for (const course of courses) {
        try {
          const studentsRes = await api.get(`/instructor/courses/${course.id}/students`);
          if (studentsRes.data?.students) {
            for (const s of studentsRes.data.students) {
              if (!allStudents.find(existing => existing.id === s.id)) {
                allStudents.push({ ...s, course_title: course.course_title });
              }
            }
          }
        } catch { /* skip courses that fail */ }
      }
      setStudents(allStudents);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 'Distribute' && createdQuizId) {
      fetchStudents();
      fetchResults();
    }
  }, [currentStep, createdQuizId, fetchStudents]);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // ─── Invitation Handlers ──────────────────────────────────────────
  const handleEmailSingle = async () => {
    if (!singleEmail || !createdQuizId) return;
    setIsInviting(true);
    try {
      const res = await api.post(`/quiz-info/${createdQuizId}/invite`, {
        emails: [singleEmail],
      });
      setInvitations(prev => [...prev, ...(res.data.invitations || [])]);
      setSingleEmail('');
      setSuccessMsg('Invitation sent successfully!');
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleBulkInvite = async () => {
    if (selectedStudentIds.length === 0 || !createdQuizId) return;
    setIsInviting(true);
    setError(null);
    try {
      const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));
      const emails = selectedStudents.map(s => s.email);
      
      const res = await api.post(`/quiz-info/${createdQuizId}/invite`, {
        emails: emails,
      });
      
      const newInvitations = res.data.invitations || [];
      setInvitations(prev => [...prev, ...newInvitations]);
      setSelectedStudentIds([]);
      setSelectAll(false);
      setSuccessMsg(`Sent ${newInvitations.length} invitations successfully!`);
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Bulk invite failed');
    } finally {
      setIsInviting(false);
    }
  };

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/drill/take/${token}`);
    alert('Link copied to clipboard');
  };

  // ─── Results ───────────────────────────────────────────────────────
  const fetchResults = async () => {
    if (!createdQuizId) return;
    setResultsLoading(true);
    try {
      // Try the quiz-info results endpoint
      const res = await api.get(`/quiz-info/${createdQuizId}/results`);
      setResults(res.data?.results || res.data || []);
    } catch {
      // Fallback: try quiz-performance endpoint
      try {
        const res = await api.get(`/quiz-performance/${createdQuizId}`);
        setResults(res.data?.results || res.data || []);
      } catch {
        console.error('Failed to fetch results');
      }
    } finally {
      setResultsLoading(false);
    }
  };

  // ─── Progress Bar ──────────────────────────────────────────────────
  const progressPercent = ((currentStepIdx + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full tracking-widest uppercase">
            Quiz Builder
          </div>
          <span className="text-xs text-gray-400 font-bold">
            {createdQuizId ? 'Editing existing drill' : 'New assessment'}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-8">
          {createdQuizId ? config.heading : 'Build Assessment'}
          <span className="block text-lg font-medium text-gray-400 mt-1">
            {createdQuizId ? 'Manage questions, distribution & results' : 'Configure, author, and deploy'}
          </span>
        </h1>

        {/* Step Progress */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStepIdx;
              const isComplete = idx < currentStepIdx;
              const Icon = step === 'Configuration' ? Settings : step === 'Questions' ? ListChecks : Send;
              return (
                <React.Fragment key={step}>
                  <button
                    onClick={() => {
                      if (idx <= currentStepIdx || (createdQuizId && idx === 1)) {
                        setCurrentStep(step);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isComplete
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-300'
                    } ${(!createdQuizId && idx > 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={!createdQuizId && idx > 0}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-black tracking-widest uppercase hidden sm:inline">{step}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: idx < currentStepIdx ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${createdQuizId ? progressPercent : 33}%` }}
            />
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
            <AlertCircle size={20} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-bold">
            <CheckCircle2 size={20} />
            {successMsg}
            <button onClick={() => setSuccessMsg(null)} className="ml-auto p-1 hover:bg-green-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── STEP 1: CONFIGURATION ─────────────────────────────────── */}
        {currentStep === 'Configuration' && (
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm">
              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-4">
                Assessment Identification
              </label>
              <input
                type="text"
                placeholder="e.g. AI Masterclass Assessment Test - Cohort A"
                className="w-full text-2xl sm:text-3xl font-black text-gray-900 border-b-2 border-gray-100 pb-3 outline-none focus:border-blue-600 transition-colors placeholder:text-gray-200"
                value={config.heading}
                onChange={e => updateConfig('heading', e.target.value)}
              />
              <textarea
                placeholder="Brief description or instructions for students..."
                className="w-full mt-6 bg-gray-50 border-none rounded-2xl p-5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300 resize-none"
                rows={3}
                value={config.description || ''}
                onChange={e => updateConfig('description', e.target.value)}
              />
            </div>

            {/* Time Management */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                  <Timer size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Time Management</h3>
                  <p className="text-xs text-gray-400 font-medium">Set duration limits for your assessment</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => updateConfig('unlimited_time', false)}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all ${
                    !config.unlimited_time
                      ? 'bg-blue-600 text-white shadow-lg border-2 border-blue-600'
                      : 'bg-gray-50 text-gray-400 border-2 border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <Clock size={16} className="inline mr-2" />
                  Timed
                </button>
                <button
                  onClick={() => updateConfig('unlimited_time', true)}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all ${
                    config.unlimited_time
                      ? 'bg-blue-600 text-white shadow-lg border-2 border-blue-600'
                      : 'bg-gray-50 text-gray-400 border-2 border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <Infinity size={16} className="inline mr-2" />
                  No Time Limit
                </button>
              </div>

              {!config.unlimited_time && (
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl">
                  <span className="text-sm font-bold text-gray-600">Time Limit:</span>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={config.time_limit_minutes || 30}
                    onChange={e => updateConfig('time_limit_minutes', parseInt(e.target.value) || 30)}
                    className="w-24 bg-white border border-gray-200 rounded-xl px-4 py-3 text-center font-black text-gray-900 outline-none focus:border-blue-400"
                  />
                  <span className="text-sm font-bold text-gray-400">minutes</span>
                </div>
              )}
            </div>

            {/* Collaborative Assessment */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Collaborative Assessment</h3>
                  <p className="text-xs text-gray-400 font-medium">Enable group work mode for this quiz</p>
                </div>
              </div>

              <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50/50 transition-all">
                <input
                  type="checkbox"
                  checked={config.group_mode}
                  onChange={e => updateConfig('group_mode', e.target.checked)}
                  className="w-5 h-5 rounded-lg accent-blue-600"
                />
                <div>
                  <span className="text-sm font-black text-gray-900">Enable Group Work Mode</span>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Students can collaborate in groups for this assessment
                  </p>
                </div>
              </label>

              {config.group_mode && (
                <div className="mt-4 ml-9 p-5 bg-purple-50/50 border border-purple-100 rounded-2xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.only_leader_submit}
                      onChange={e => updateConfig('only_leader_submit', e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-600"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-900">
                        Only group leaders can submit
                      </span>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        Restrict submission to designated group leaders only
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Scoring & Attempts */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Scoring & Attempts</h3>
                  <p className="text-xs text-gray-400 font-medium">Set passing criteria and retry limits</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 bg-gray-50 rounded-2xl">
                  <label className="text-xs font-black text-gray-400 tracking-widest uppercase block mb-3">
                    Passing Score (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={config.passing_score_percent}
                      onChange={e => updateConfig('passing_score_percent', parseInt(e.target.value))}
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-2xl font-black text-blue-600 min-w-[3rem] text-center">
                      {config.passing_score_percent}%
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl">
                  <label className="text-xs font-black text-gray-400 tracking-widest uppercase block mb-3">
                    Max Attempts
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={config.max_attempts || 1}
                      onChange={e => updateConfig('max_attempts', parseInt(e.target.value) || 1)}
                      className="w-24 bg-white border border-gray-200 rounded-xl px-4 py-3 text-center font-black text-gray-900 outline-none focus:border-blue-400"
                    />
                    <span className="text-sm font-bold text-gray-400">
                      {config.max_attempts === 1 ? 'attempt' : 'attempts'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save & Next */}
            <div className="flex gap-4">
              <Button
                onClick={handleCreateQuiz}
                disabled={isSubmitting}
                className="flex-1 py-6 bg-blue-950 text-white rounded-[2.5rem] font-black text-[11px] tracking-widest uppercase shadow-xl shadow-blue-200 hover:bg-black transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin inline mr-2" size={16} />
                ) : (
                  <Save className="inline mr-2" size={16} />
                )}
                {createdQuizId ? 'SAVE & CONTINUE' : 'SAVE & BUILD QUESTIONS'}
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: QUESTIONS ─────────────────────────────────────── */}
        {currentStep === 'Questions' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <ListChecks size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    Questions ({questions.length})
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">
                    Total Points: {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {createdQuizId && (
                  <Button
                    onClick={handleUpdateQuestions}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-widest"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} className="inline mr-1" />}
                    Save All
                  </Button>
                )}
              </div>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm relative group">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center rounded-xl font-black text-xs">
                      Q{qIdx + 1}
                    </div>
                    <select
                      className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black text-gray-500 tracking-widest uppercase outline-none cursor-pointer"
                      value={q.quiz_question_type_id}
                      onChange={e => updateQuestion(qIdx, 'quiz_question_type_id', parseInt(e.target.value))}
                    >
                      <option value={1}>Multiple Choice</option>
                      <option value={2}>Essay / Direct Response</option>
                      <option value={3}>File Upload</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-300">Points:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points || 10}
                        onChange={e => updateQuestion(qIdx, 'points', parseInt(e.target.value) || 10)}
                        className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-xs font-black text-gray-700 outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      className="p-2 text-gray-200 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                {/* Question Text */}
                <textarea
                  placeholder="Enter question text..."
                  className="w-full text-lg font-bold border-none outline-none bg-gray-50/50 p-5 rounded-2xl mb-6 placeholder:text-gray-200 resize-none"
                  rows={2}
                  value={q.question}
                  onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
                />

                {/* MCQ Answers */}
                {q.quiz_question_type_id === 1 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">
                      Answer Options
                    </label>
                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-3">
                        <button
                          onClick={() => setCorrectAnswer(qIdx, aIdx)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                            a.is_right
                              ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100'
                              : 'border-gray-200 hover:border-green-300 text-gray-300'
                          }`}
                          title={a.is_right ? 'Correct answer' : 'Mark as correct'}
                        >
                          {a.is_right ? <CheckCircle2 size={16} /> : <span className="text-[10px] font-black">?</span>}
                        </button>
                        <input
                          type="text"
                          placeholder={`Option ${aIdx + 1}...`}
                          className="flex-1 bg-gray-50 border-none rounded-xl px-5 py-3.5 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                          value={a.answer}
                          onChange={e => updateAnswer(qIdx, aIdx, e.target.value)}
                        />
                        {q.answers.length > 1 && (
                          <button
                            onClick={() => removeAnswer(qIdx, aIdx)}
                            className="p-2 text-gray-200 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addAnswer(qIdx)}
                      className="flex items-center gap-2 text-[10px] font-black text-blue-600 tracking-widest uppercase mt-4 hover:bg-blue-50 px-5 py-3 rounded-xl transition-all"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  </div>
                )}

                {/* Essay */}
                {q.quiz_question_type_id === 2 && (
                  <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex items-center gap-4 text-gray-400 bg-gray-50/30">
                    <FileText size={24} />
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase block">
                        Essay / Direct Response Mode
                      </span>
                      <span className="text-xs font-medium text-gray-300">
                        Students will type free-text responses
                      </span>
                    </div>
                  </div>
                )}

                {/* File Upload */}
                {q.quiz_question_type_id === 3 && (
                  <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex items-center gap-4 text-gray-400 bg-gray-50/30">
                    <Image size={24} />
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase block">
                        File Upload Mode
                      </span>
                      <span className="text-xs font-medium text-gray-300">
                        Students will upload files (PDF, DOCX, images, etc.)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="w-full py-8 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex items-center justify-center gap-3 text-gray-400 hover:border-blue-200 hover:text-blue-500 transition-all font-black text-[10px] tracking-widest uppercase bg-white/50"
            >
              <Plus size={20} /> Add Question
            </button>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep('Configuration')}
                className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-[2.5rem] font-black text-[10px] tracking-widest uppercase hover:bg-gray-200 transition-all"
              >
                <ChevronLeft size={16} className="inline mr-1" /> Back
              </Button>
              <Button
                onClick={() => {
                  if (createdQuizId) {
                    handleUpdateQuestions().then(() => setCurrentStep('Distribute'));
                  } else {
                    handleCreateQuiz().then(() => setCurrentStep('Distribute'));
                  }
                }}
                disabled={isSubmitting}
                className="flex-1 py-5 bg-blue-950 text-white rounded-[2.5rem] font-black text-[10px] tracking-widest uppercase shadow-xl shadow-blue-200 hover:bg-black transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin inline mr-2" size={16} />
                ) : (
                  <>
                    Save & Distribute <ChevronRight size={16} className="inline ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: DISTRIBUTE & RESULTS ──────────────────────────── */}
        {currentStep === 'Distribute' && (
          <div className="space-y-8">
            {/* Distribution Header */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <Send size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Distribute Assessment</h2>
                  <p className="text-sm text-gray-400 font-medium">
                    {createdQuizId ? `Quiz #${createdQuizId}: ${config.heading}` : 'Email quiz links to students'}
                  </p>
                </div>
              </div>

              {/* Single Email */}
              <div className="relative mb-4">
                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-3">
                  Quick Invite — Single Email
                </label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="student@example.com"
                    className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    value={singleEmail}
                    onChange={e => setSingleEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSingle()}
                  />
                  <Button
                    onClick={handleEmailSingle}
                    disabled={isInviting || !singleEmail}
                    className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase"
                  >
                    {isInviting ? <Loader2 className="animate-spin" size={14} /> : 'Send'}
                  </Button>
                </div>
              </div>

              {/* Bulk Student Selection */}
              <div className="border-t border-gray-50 pt-6 mt-6">
                <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-3">
                  Bulk Invite — Enrolled Students
                </label>

                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="text"
                      placeholder="Search students by name or email..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => fetchStudents()}
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all text-gray-400"
                    title="Refresh student list"
                  >
                    <Filter size={18} />
                  </button>
                </div>

                {studentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar rounded-2xl border border-gray-100">
                      {/* Select All */}
                      <label className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-blue-50/30 transition-all sticky top-0 z-10">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className="text-xs font-black text-gray-700 tracking-widest uppercase">
                          SELECT ALL ({filteredStudents.length} students)
                        </span>
                      </label>

                      {filteredStudents.map(student => (
                        <label
                          key={student.id}
                          className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 cursor-pointer hover:bg-blue-50/20 transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="w-4 h-4 rounded accent-blue-600"
                          />
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-black text-sm flex-shrink-0">
                            {student.name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
                            <p className="text-xs text-gray-400 truncate">{student.email}</p>
                          </div>
                          <span className="text-[10px] font-bold text-gray-300">{student.course_title}</span>
                        </label>
                      ))}
                    </div>

                    {selectedStudentIds.length > 0 && (
                      <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                        <span className="text-sm font-bold text-blue-700">
                          {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
                        </span>
                        <Button
                          onClick={handleBulkInvite}
                          disabled={isInviting}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-widest"
                        >
                          {isInviting ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <>
                              <Send size={14} className="inline mr-1" /> Send All Invites
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sent Invitations */}
            {invitations.length > 0 && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Mail size={20} className="text-blue-600" />
                  Sent Invitations ({invitations.length})
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {invitations.map((inv, idx) => (
                    <div
                      key={inv.id || idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-[10px]">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{inv.email}</span>
                      </div>
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        className="flex items-center gap-2 px-3 py-2 text-[9px] font-black text-gray-400 hover:text-blue-600 tracking-widest uppercase transition-colors"
                      >
                        <Copy size={12} /> Copy Link
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Preview */}
            {createdQuizId && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <Eye size={20} className="text-purple-600" />
                    Student Results
                  </h3>
                  <button
                    onClick={fetchResults}
                    className="text-[10px] font-black text-blue-600 tracking-widest uppercase hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {resultsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Eye size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-bold">No submissions yet</p>
                    <p className="text-xs font-medium mt-1">Results will appear once students complete the quiz</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="pb-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Student</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Score</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">%</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Status</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Attempt</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, idx) => (
                          <tr key={r.student_id || idx} className="border-b border-gray-50 hover:bg-blue-50/20 transition-all">
                            <td className="py-4 pr-4">
                              <p className="text-sm font-bold text-gray-900">{r.student_name}</p>
                              <p className="text-xs text-gray-400">{r.student_email}</p>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="text-sm font-black text-gray-900">
                                {r.score} / {r.total_points}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <span className={`text-sm font-black ${r.passed ? 'text-green-600' : 'text-red-500'}`}>
                                {r.percentage}%
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                  r.passed
                                    ? 'bg-green-50 text-green-600'
                                    : 'bg-red-50 text-red-500'
                                }`}
                              >
                                {r.passed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="text-xs font-bold text-gray-500">#{r.attempt_number}</span>
                            </td>
                            <td className="py-4">
                              <span className="text-xs font-medium text-gray-400">
                                {new Date(r.submitted_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep('Questions')}
                className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-[2.5rem] font-black text-[10px] tracking-widest uppercase hover:bg-gray-200 transition-all"
              >
                <ChevronLeft size={16} className="inline mr-1" /> Edit Questions
              </Button>
              <Button
                onClick={() => router.push('/instructor/analytics')}
                className="flex-1 py-5 bg-blue-950 text-white rounded-[2.5rem] font-black text-[10px] tracking-widest uppercase shadow-xl shadow-blue-200 hover:bg-black transition-all"
              >
                View Analytics <ExternalLink size={14} className="inline ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}