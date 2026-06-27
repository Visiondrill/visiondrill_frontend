 'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  ChevronLeft,
  ShieldCheck,
  Target,
  Timer,
  Infinity,
  RotateCcw,
  Eye,
  FileText,
  Upload,
  FileUp,
  X,
} from 'lucide-react';
import Button from '@/components/Button';
import SafeHTML from '@/components/SafeHTML';
import RichTextEditor from '@/components/RichTextEditor';
import Link from 'next/link';

interface QuizAnswer {
  id: number;
  answer: string;
  correct?: number;
  is_right?: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  quiz_question_type_id: number; // 1=MCQ, 2=Essay, 3=File Upload
  points: number;
  answers: QuizAnswer[];
  student_answer?: any;
  essay_feedback?: string;
  essay_score?: number;
  graded?: boolean;
}

interface QuizData {
  quiz: {
    id: number;
    heading: string;
    description?: string;
    time_limit_minutes: number | null;
    unlimited_time: boolean;
    passing_score_percent: number;
    max_attempts: number | null;
    quiz_questions: QuizQuestion[];
  };
  attempt?: {
    id: number;
    attempt_number: number;
    started_at: string;
    submitted_at: string | null;
    score?: number;
    total_points?: number;
    percentage?: number;
    passed?: boolean;
    answers?: any[];
  };
  remaining_attempts?: number | null;
}

export default function TakeStudentQuiz() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = id ? Number(id) : 0;

  const [data, setData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch quiz data
  useEffect(() => {
    if (!quizId) return;
    fetchQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  const fetchQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/user/quiz/${quizId}/questions`);
      const quizData = res.data;

      // Check for previous attempt
      if (quizData.attempt?.submitted_at) {
        setIsReview(true);
        // Pre-populate answers from attempt
        if (quizData.attempt.answers) {
          const prevAnswers: Record<number, any> = {};
          quizData.attempt.answers.forEach((a: any) => {
            prevAnswers[a.quiz_question_id || a.question_id] =
              a.selected_answer_id || a.answer_text || a.file_path || a;
          });
          setAnswers(prevAnswers);
        }
      }

      // Initialize timer if timed
      if (!quizData.quiz.unlimited_time && quizData.quiz.time_limit_minutes && !quizData.attempt?.submitted_at) {
        const totalSeconds = (quizData.quiz.time_limit_minutes || 30) * 60;
        setTimeRemaining(totalSeconds);
      }

      setData(quizData);
    } catch (err: any) {
      console.error('Failed to fetch quiz', err);
      // Try fallback: quiz-info endpoint
      try {
        const infoRes = await api.get(`/quiz-info/${quizId}/show`);
        setData({
          quiz: { ...infoRes.data?.quiz || infoRes.data, quiz_questions: infoRes.data?.questions || [] },
          attempt: infoRes.data?.attempt,
        });
      } catch {
        setError('Unable to load quiz. It may not exist or you may not have access.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Timer logic
  const startExam = () => {
    setExamStarted(true);
    if (timeRemaining && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answer handlers
  const handleMcqAnswer = (questionId: number, answerId: number) => {
    if (isReview) return;
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleEssayAnswer = (questionId: number, text: string) => {
    if (isReview) return;
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleFileAnswer = (questionId: number, file: File | null) => {
    if (isReview || !file) return;
    setAnswers(prev => ({ ...prev, [questionId]: file }));
  };

  const clearFileAnswer = (questionId: number) => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  // Submit quiz
  const handleSubmit = async () => {
    if (isSubmitting || !data) return;

    setIsSubmitting(true);
    try {
      // For questions with files, we'd need multipart. For simplicity, send text-based answers first
      // and handle file uploads via a separate mechanism if needed.
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => {
        const q = data.quiz.quiz_questions.find(q => q.id === parseInt(questionId));
        if (!q) return null;

        if (q.quiz_question_type_id === 1) {
          // MCQ
          return {
            quiz_question_id: parseInt(questionId),
            selected_answer_id: answer,
          };
        } else if (q.quiz_question_type_id === 2) {
          // Essay
          return {
            quiz_question_id: parseInt(questionId),
            answer_text: typeof answer === 'string' ? answer : '',
          };
        } else if (q.quiz_question_type_id === 3) {
          // File - skip for now (would need multipart)
          return {
            quiz_question_id: parseInt(questionId),
            file: answer instanceof File ? answer.name : null,
          };
        }
        return null;
      }).filter(Boolean);

      // Calculate tentative MCQ score
      let correct = 0;
      let totalMcqPoints = 0;
      data.quiz.quiz_questions.forEach(q => {
        if (q.quiz_question_type_id === 1) {
          const selectedId = answers[q.id];
          const rightAnswer = q.answers.find(a => a.correct === 1 || a.is_right);
          if (rightAnswer && rightAnswer.id === selectedId) {
            correct += q.points || 1;
          }
          totalMcqPoints += q.points || 1;
        }
      });

      const percentage = totalMcqPoints > 0
        ? Math.round((correct / totalMcqPoints) * 100)
        : 0;

      try {
        const res = await api.post(`/user/quiz/${quizId}/save-answers`, {
          answers: formattedAnswers,
          score: percentage,
        });
        setSubmissionResult({
          ...res.data,
          mcqScore: correct,
          mcqTotal: totalMcqPoints,
          percentage,
          passed: (res.data?.passing_score_percent
            ? percentage >= res.data.passing_score_percent
            : percentage >= (data.quiz.passing_score_percent || 60)),
        });
      } catch (submitErr) {
        // Fallback: try quiz-performance/create
        const perfRes = await api.post('/quiz-performance/create', {
          quiz_id: quizId,
          answers: formattedAnswers,
          score: percentage,
        });
        setSubmissionResult({
          ...perfRes.data,
          mcqScore: correct,
          mcqTotal: totalMcqPoints,
          percentage,
          passed: percentage >= (data.quiz.passing_score_percent || 60),
        });
      }

      setSubmitted(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err: any) {
      console.error('Submission error', err);
      alert(getErrorMessage(err) || 'Failed to submit quiz answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasEssayQuestions = data?.quiz.quiz_questions.some(q => q.quiz_question_type_id === 2);
  const unansweredCount = examStarted && !isReview
    ? data?.quiz.quiz_questions.filter(q => {
        // Skip file questions for this count
        if (q.quiz_question_type_id === 3) return false;
        return !answers[q.id];
      }).length || 0
    : 0;

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-xs font-medium text-gray-400">Loading assessment...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-500" size={40} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Quiz Unavailable</h1>
        <p className="text-gray-400 font-medium mb-8">{error || 'This quiz could not be loaded.'}</p>
        <Link href="/student/quizzes">
          <Button>Back to Quizzes</Button>
        </Link>
      </div>
    );
  }

  // Submission success screen
  if (submitted && submissionResult) {
    const passed = submissionResult.passed;
    const pct = submissionResult.percentage || 0;

    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${
          passed ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-amber-500 text-white shadow-amber-200'
        }`}>
          {passed ? <CheckCircle2 size={56} /> : <AlertTriangle size={56} />}
        </div>

        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
          {passed ? 'Congratulations!' : 'Assessment Submitted'}
        </h1>
        <p className="text-gray-400 font-medium text-lg mb-10">
          {passed
            ? 'You have successfully passed this assessment.'
            : 'Your answers have been recorded. Review your results below.'}
        </p>

        {/* Score Card */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 shadow-sm mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-6 rounded-2xl text-center ${passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <p className="text-3xl font-black text-gray-900">
                {submissionResult.score ?? submissionResult.mcqScore ?? pct}
                <span className="text-lg text-gray-400">/{submissionResult.total_points ?? submissionResult.mcqTotal ?? 100}</span>
              </p>
              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mt-2">Score</p>
            </div>
            <div className={`p-6 rounded-2xl text-center ${passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <p className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {pct}%
              </p>
              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mt-2">Percentage</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
            <Target size={20} className="text-purple-500" />
            <div>
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Passing Threshold</span>
              <span className="text-sm font-bold text-gray-900">{data.quiz.passing_score_percent || 60}%</span>
            </div>
          </div>

          {hasEssayQuestions && (
            <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
              <FileText size={20} className="text-blue-500" />
              <p className="text-xs font-bold text-blue-700">
                This assessment includes essay questions that require manual grading.
                Your instructor will review and provide feedback for those responses.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/student/quizzes">
            <Button className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-xs tracking-widest">
              <ChevronLeft size={16} className="inline mr-1" /> All Quizzes
            </Button>
          </Link>
          {submissionResult.passed === false && (data.quiz.max_attempts === null || (data.attempt?.attempt_number || 1) < (data.quiz.max_attempts || 1)) && (
            <Button
              onClick={() => {
                setSubmitted(false);
                setSubmissionResult(null);
                setAnswers({});
                setExamStarted(false);
                setTimeRemaining(data.quiz.time_limit_minutes ? data.quiz.time_limit_minutes * 60 : null);
              }}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-blue-200"
            >
              <RotateCcw size={16} className="inline mr-1" /> Retake Quiz
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Review mode (previous submission)
  if (isReview && !examStarted) {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        {/* Review Header */}
        <div className="mb-10">
          <Link
            href="/student/quizzes"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 mb-6 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Quizzes
          </Link>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase bg-purple-50 text-purple-600">
                  Review Mode
                </div>
                <span className="text-[10px] font-bold text-gray-400">Attempt #{data.attempt?.attempt_number || 1}</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">{data.quiz.heading}</h1>
            {data.quiz.description && (
              <p className="text-gray-500 font-medium">{data.quiz.description}</p>
            )}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-50">
              <div className="p-4 bg-gray-50 rounded-2xl text-center">
                <p className="text-2xl font-black text-gray-900">{data.attempt?.score || '-'}/{data.attempt?.total_points || '-'}</p>
                <p className="text-[10px] font-bold text-gray-400  tracking-widest uppercase">Score</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-center">
                <p className={`text-2xl font-black ${data.attempt?.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                  {data.attempt?.percentage || '-'}%
                </p>
                <p className="text-[10px] font-bold text-gray-400  tracking-widest uppercase">Percentage</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-center">
                <p className={`text-2xl font-black ${data.attempt?.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                  {data.attempt?.passed ? 'PASSED' : 'FAILED'}
                </p>
                <p className="text-[10px] font-bold text-gray-400  tracking-widest uppercase">Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="space-y-6">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Eye size={20} className="text-blue-600" /> Answer Review
          </h2>
          {data.quiz.quiz_questions.map((q, idx) => {
            const studentAnswer = answers[q.id];
            const isMcq = q.quiz_question_type_id === 1;
            const isEssay = q.quiz_question_type_id === 2;
            const correctAnswer = isMcq ? q.answers.find(a => a.correct === 1 || a.is_right) : null;
            const studentSelectedAnswer = isMcq
              ? q.answers.find(a => a.id === studentAnswer)
              : null;
            const isCorrect = isMcq && studentSelectedAnswer?.id === correctAnswer?.id;

            return (
              <div key={q.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      isCorrect ? 'bg-emerald-500 text-white' : isMcq ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <SafeHTML html={q.question} className="text-sm font-bold text-gray-900" />
                      <span className="text-[10px] font-bold text-gray-400">
                        {isMcq ? 'Multiple Choice' : isEssay ? 'Essay Response' : 'File Upload'} • {q.points || '?'} pts
                      </span>
                    </div>
                  </div>
                  {isMcq && (
                    <span className={`text-[10px] font-black tracking-widest uppercase ${
                      isCorrect ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                </div>

                {isMcq && (
                  <div className="space-y-2 ml-11">
                    {q.answers.map(a => (
                      <div
                        key={a.id}
                        className={`p-3 rounded-xl text-sm font-semibold border ${
                          a.id === correctAnswer?.id
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : a.id === studentAnswer && a.id !== correctAnswer?.id
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-gray-50 border-gray-100 text-gray-500'
                        }`}
                      >
                        {a.answer}
                        {a.id === correctAnswer?.id && (
                          <CheckCircle2 size={14} className="inline ml-2 text-emerald-500" />
                        )}
                        {a.id === studentAnswer && a.id !== correctAnswer?.id && (
                          <X size={14} className="inline ml-2 text-red-400" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isEssay && (
                  <div className="ml-11 space-y-3">
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">Your Response</p>
                      <p className="text-sm font-medium text-gray-700">
                        {typeof studentAnswer === 'string' ? studentAnswer : JSON.stringify(studentAnswer?.answer_text || studentAnswer || 'No response submitted')}
                      </p>
                    </div>
                    {q.essay_feedback && (
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-[10px] font-black text-blue-600 tracking-widest uppercase mb-2">Instructor Feedback</p>
                        <p className="text-sm font-medium text-blue-800">{q.essay_feedback}</p>
                        {q.essay_score !== undefined && (
                          <p className="text-xs font-bold text-blue-600 mt-2">Score: {q.essay_score}/{q.points}</p>
                        )}
                      </div>
                    )}
                    {!q.essay_feedback && (
                      <p className="text-xs text-gray-400 italic">Awaiting instructor grading...</p>
                    )}
                  </div>
                )}

                {q.quiz_question_type_id === 3 && (
                  <div className="ml-11 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">Uploaded File</p>
                    <p className="text-sm font-medium text-gray-700">
                      {studentAnswer?.name || studentAnswer?.file_path || 'File submitted'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            onClick={() => {
              setIsReview(false);
              setExamStarted(true);
            }}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-blue-200"
          >
            <RotateCcw size={16} className="inline mr-1" /> Attempt Again
          </Button>
        </div>
      </div>
    );
  }

  // Pre-exam intro screen
  if (!examStarted && !isReview) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <Link
          href="/student/quizzes"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 mb-8 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Quizzes
        </Link>

        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase bg-blue-50 text-blue-600">
              Assessment Ready
            </div>
            {data.attempt && (
              <span className="text-[10px] font-bold text-gray-400">
                Previous attempt: {data.attempt.percentage || '—'}%
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
            {data.quiz.heading}
          </h1>
          {data.quiz.description && (
            <SafeHTML html={data.quiz.description} className="text-gray-500 font-medium mb-8" />
          )}

          {/* Key Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              {data.quiz.unlimited_time ? (
                <Infinity size={20} className="text-purple-500" />
              ) : (
                <Timer size={20} className="text-orange-500" />
              )}
              <div>
                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Time</span>
                <span className="text-sm font-bold text-gray-900">
                  {data.quiz.unlimited_time ? 'Unlimited' : `${data.quiz.time_limit_minutes} minutes`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <Target size={20} className="text-purple-500" />
              <div>
                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Passing Score</span>
                <span className="text-sm font-bold text-gray-900">{data.quiz.passing_score_percent || 60}%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <FileText size={20} className="text-blue-500" />
              <div>
                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Questions</span>
                <span className="text-sm font-bold text-gray-900">{data.quiz.quiz_questions.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <RotateCcw size={20} className="text-emerald-500" />
              <div>
                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Attempts</span>
                <span className="text-sm font-bold text-gray-900">
                  {data.attempt?.attempt_number || 0} / {data.quiz.max_attempts || '∞'}
                  {data.remaining_attempts !== undefined && data.remaining_attempts !== null && (
                    <> ({data.remaining_attempts} remaining)</>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={() => {
              if (data.quiz.quiz_questions.some(q => q.quiz_question_type_id === 3)) {
                if (!confirm('This quiz contains file upload questions. You will need to upload files to complete them. Continue?')) {
                  return;
                }
              }
              startExam();
            }}
            className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-[11px] tracking-widest uppercase shadow-xl shadow-blue-200 hover:bg-black transition-all"
          >
            <Sparkles size={18} className="inline mr-2" /> Begin Assessment
          </Button>

          {hasEssayQuestions && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-xs font-bold text-blue-700">
                <FileText size={14} className="inline mr-1" />
                Note: This assessment contains essay questions that will be manually graded by your instructor.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- EXAM IN PROGRESS ---
  const quiz = data.quiz;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Timer Bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4 mb-10 rounded-b-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-gray-900 line-clamp-1">{quiz.heading}</h2>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {Object.keys(answers).filter(k => {
                const numKey = Number(k);
                return answers[numKey] !== undefined && answers[numKey] !== '';
              }).length}/{quiz.quiz_questions.length} answered
            </span>
          </div>
          {timeRemaining !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm ${
              timeRemaining < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-orange-50 text-orange-600'
            }`}>
              <Clock size={16} />
              {formatTime(timeRemaining)}
            </div>
          )}
          {data.quiz.unlimited_time && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs bg-purple-50 text-purple-600">
              <Infinity size={16} />
              No Time Limit
            </div>
          )}
        </div>
        {timeRemaining !== null && (
          <div className="w-full h-1 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timeRemaining < 60 ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{
                width: `${(timeRemaining / ((quiz.time_limit_minutes || 30) * 60)) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-10">
        {quiz.quiz_questions.map((q, idx) => (
          <div
            key={q.id}
            id={`question-${q.id}`}
            className={`bg-white border rounded-[2.5rem] p-8 sm:p-10 shadow-sm transition-all ${
              answers[q.id] !== undefined && answers[q.id] !== ''
                ? 'border-blue-200 ring-4 ring-blue-50'
                : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                answers[q.id] !== undefined && answers[q.id] !== ''
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <SafeHTML html={q.question} className="text-xl font-bold text-gray-900 leading-tight mb-1" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                    {q.quiz_question_type_id === 1 ? 'Multiple Choice' :
                     q.quiz_question_type_id === 2 ? 'Essay Response' : 'File Upload'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-300">• {q.points || 10} pts</span>
                </div>
              </div>
            </div>

            {/* MCQ */}
            {q.quiz_question_type_id === 1 && (
              <div className="grid grid-cols-1 gap-3 ml-14">
                {q.answers.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleMcqAnswer(q.id, a.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      answers[q.id] === a.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                        : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50/30'
                    }`}
                  >
                    <span className={`font-semibold text-sm ${
                      answers[q.id] === a.id ? 'text-white' : ''
                    }`}>
                      {a.answer}
                    </span>
                    {answers[q.id] === a.id && (
                      <CheckCircle2 size={20} className="text-white" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Essay */}
            {q.quiz_question_type_id === 2 && (
              <div className="ml-14">
                <RichTextEditor
                  placeholder="Type your response here..."
                  content={answers[q.id] || ''}
                  onChange={val => handleEssayAnswer(q.id, val)}
                  minHeight="180px"
                />
                <p className="text-[10px] text-gray-400 font-medium mt-2">
                  {(answers[q.id]?.replace(/<[^>]*>/g, '').length || 0)} characters typed
                </p>
              </div>
            )}

            {/* File Upload */}
            {q.quiz_question_type_id === 3 && (
              <div className="ml-14">
                {answers[q.id] ? (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileUp size={20} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-bold text-blue-700">
                          {answers[q.id] instanceof File ? answers[q.id].name : 'File selected'}
                        </p>
                        <p className="text-[10px] text-blue-400 font-medium">
                          {answers[q.id] instanceof File
                            ? `${(answers[q.id].size / 1024).toFixed(1)} KB`
                            : 'Ready to upload'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearFileAnswer(q.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      onChange={e => handleFileAnswer(q.id, e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="p-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50/20 transition-all">
                      <Upload size={32} className="text-gray-300 mb-3" />
                      <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                        Click to upload file
                      </p>
                      <p className="text-xs text-gray-300 font-medium mt-1">
                        PDF, DOCX, Images or any file type
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Area */}
      <div className="mt-14 flex flex-col items-center">
        {unansweredCount > 0 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700">
            <AlertTriangle size={18} />
            <span className="text-sm font-bold">
              {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered
            </span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full max-w-lg py-6 bg-blue-600 hover:bg-black text-white rounded-[2.5rem] font-black text-xs tracking-[0.2em] uppercase shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin mx-auto" size={20} />
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Send size={18} /> Submit Assessment
            </div>
          )}
        </button>

        <p className="mt-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">
          End of Assessment • VisionDrill
        </p>
      </div>
    </div>
  );
}