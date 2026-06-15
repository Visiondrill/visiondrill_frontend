'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  BarChart3,
  Sparkles,
  Eye,
  RotateCcw,
  Play,
} from 'lucide-react';
import Button from '@/components/Button';

interface StudentQuiz {
  id: number;
  quiz_id: number;
  heading: string;
  description?: string;
  time_limit_minutes: number | null;
  unlimited_time: boolean;
  passing_score_percent: number;
  max_attempts: number | null;
  total_questions: number;
  total_points: number;
  status: string;
  score?: number;
  percentage?: number;
  passed?: boolean;
  attempt_number?: number;
  submitted_at?: string;
  remaining_attempts?: number | null;
}

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      // Fetch student's quiz attempts / assigned quizzes
      const res = await api.get('/student/quizzes');
      const data = res.data?.quizzes || res.data || [];
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to fetch student quizzes', err);
      // Fallback: try fetching from quiz-performance endpoint
      try {
        const perfRes = await api.get('/quiz-performance/create');
        setQuizzes(perfRes.data?.quizzes || []);
      } catch {
        setQuizzes([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const availableQuizzes = quizzes.filter(
    q => !q.submitted_at || (q.max_attempts && (q.attempt_number || 0) < (q.max_attempts))
  );
  const completedQuizzes = quizzes.filter(
    q => q.submitted_at && (!q.max_attempts || (q.attempt_number || 0) >= (q.max_attempts || 1))
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-xs font-medium text-gray-400">Loading your assessments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-600 text-xs font-black">
            Assessment Center
          </div>
          <span className="text-gray-400 font-bold text-xs">
            • {quizzes.length} quizzes assigned
          </span>
        </div>
        <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight mb-6">
          My Quizzes &<br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent italic text-4xl lg:text-5xl">
            Assessments.
          </span>
        </h1>
        <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-xl">
          Take assigned quizzes, track your performance, and review past attempts.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
        {(['available', 'completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'available' && <Play size={14} className="inline mr-2" />}
            {tab === 'completed' && <CheckCircle2 size={14} className="inline mr-2" />}
            {tab}
            {tab === 'available' && availableQuizzes.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-[9px]">
                {availableQuizzes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {quizzes.length === 0 && (
        <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem]">
          <Sparkles className="mx-auto mb-6 text-gray-200" size={80} />
          <h3 className="text-2xl font-black text-gray-800 mb-2">No assessments yet</h3>
          <p className="text-gray-400 font-medium mb-8 max-w-md mx-auto">
            When your instructor assigns you a quiz or assessment, it will appear here.
          </p>
        </div>
      )}

      {/* Available Quizzes */}
      {activeTab === 'available' && (
        <>
          {availableQuizzes.length === 0 ? (
            <div className="text-center py-16 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem]">
              <CheckCircle2 className="mx-auto mb-4 text-emerald-200" size={64} />
              <h3 className="text-xl font-black text-gray-800 mb-2">All caught up!</h3>
              <p className="text-gray-400 font-medium">
                You've completed all assigned assessments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {availableQuizzes.map(quiz => (
                <div
                  key={quiz.id || quiz.quiz_id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                        quiz.submitted_at
                          ? 'bg-orange-50 text-orange-500'
                          : 'bg-green-50 text-green-600'
                      }`}
                    >
                      {quiz.submitted_at ? 'Retake Available' : 'Ready'}
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {quiz.heading}
                  </h3>
                  {quiz.description && (
                    <p className="text-xs text-gray-400 font-medium mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  {/* Meta Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-orange-400" />
                      <span className="text-[10px] font-bold text-gray-400">
                        {quiz.unlimited_time
                          ? 'No limit'
                          : `${quiz.time_limit_minutes}m`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-purple-400" />
                      <span className="text-[10px] font-bold text-gray-400">
                        Pass: {quiz.passing_score_percent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-blue-400" />
                      <span className="text-[10px] font-bold text-gray-400">
                        {quiz.total_questions} questions
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-gray-400">
                        {quiz.submitted_at
                          ? `${(quiz.attempt_number || 0)}/${quiz.max_attempts || '∞'} used`
                          : `${quiz.max_attempts || '∞'} attempts`}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/student/quizzes/${quiz.quiz_id || quiz.id}/take`}
                    className="mt-4"
                  >
                    <Button className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-black transition-all">
                      {quiz.submitted_at ? (
                        <>
                          <RotateCcw size={14} className="inline mr-2" /> Retake
                        </>
                      ) : (
                        <>
                          <Play size={14} className="inline mr-2" /> Start Quiz
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Completed Quizzes */}
      {activeTab === 'completed' && (
        <>
          {completedQuizzes.length === 0 ? (
            <div className="text-center py-16 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem]">
              <Eye className="mx-auto mb-4 text-gray-200" size={64} />
              <h3 className="text-xl font-black text-gray-800 mb-2">No completed assessments</h3>
              <p className="text-gray-400 font-medium">
                Finished assessments will appear here with your scores.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-20">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                        Assessment
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                        Score
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                        %
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                        Status
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                        Attempt
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                        Date
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedQuizzes.map((q, idx) => (
                      <tr
                        key={q.id || q.quiz_id || idx}
                        className="border-b border-gray-50 hover:bg-blue-50/20 transition-all"
                      >
                        <td className="py-4 px-6">
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">
                            {q.heading}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-black text-gray-900">
                            {q.score ?? '-'} / {q.total_points || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  q.passed ? 'bg-green-500' : 'bg-red-400'
                                }`}
                                style={{ width: `${q.percentage || 0}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-black ${
                                q.passed ? 'text-green-600' : 'text-red-500'
                              }`}
                            >
                              {q.percentage ?? '-'}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
                              q.passed
                                ? 'bg-green-50 text-green-600'
                                : 'bg-red-50 text-red-500'
                            }`}
                          >
                            {q.passed ? (
                              <CheckCircle2 size={10} className="mr-1" />
                            ) : (
                              <XCircle size={10} className="mr-1" />
                            )}
                            {q.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-bold text-gray-500">
                            #{q.attempt_number || 1}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-medium text-gray-400">
                            {q.submitted_at
                              ? new Date(q.submitted_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <Link
                            href={`/student/quizzes/${q.quiz_id || q.id}/take`}
                            className="text-[10px] font-black text-blue-600 tracking-widest uppercase hover:underline"
                          >
                            <Eye size={12} className="inline mr-1" /> Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}