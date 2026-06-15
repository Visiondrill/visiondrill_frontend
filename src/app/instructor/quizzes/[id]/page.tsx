'use client';

import React, { useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import type { Quiz, QuizInvitation, StudentResult } from '@/types/quiz';
import {
  Loader2, ArrowLeft, Clock, Infinity, Users, Target, Send, Mail,
  Copy, Eye, Edit3, BarChart3, CheckCircle2, XCircle, Download,
  AlertCircle, Calendar, ListChecks, Check, X, UserCheck, FileText
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Button from '@/components/Button';

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [invitations, setInvitations] = useState<QuizInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'invitations'>('overview');

  useEffect(() => {
    if (quizId) fetchAllData();
  }, [quizId]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch quiz info
      const quizRes = await api.get(`/quiz-info/${quizId}`);
      setQuiz(quizRes.data?.quiz || quizRes.data);
    } catch {
      console.error('Failed to fetch quiz details');
    }

    // Fetch results
    try {
      const resultsRes = await api.get(`/quiz-info/${quizId}/results`);
      setResults(resultsRes.data?.results || resultsRes.data || []);
    } catch {
      try {
        const perfRes = await api.get(`/quiz-performance/${quizId}`);
        setResults(perfRes.data?.results || perfRes.data || []);
      } catch { /* no results yet */ }
    }

    setIsLoading(false);
  };

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/drill/take/${token}`);
    alert('Link copied to clipboard');
  };

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-xs font-medium text-gray-400">Loading quiz details...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-32">
        <AlertCircle className="mx-auto mb-6 text-gray-200" size={80} />
        <h2 className="text-2xl font-black text-gray-800 mb-2">Quiz Not Found</h2>
        <p className="text-gray-400 font-medium mb-8">This assessment may have been deleted or is unavailable.</p>
        <Link href="/instructor/quizzes">
          <Button>Back to Quizzes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Back Link */}
      <Link
        href="/instructor/quizzes"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Quizzes
      </Link>

      {/* Quiz Header */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-10 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                quiz.status === 'active' ? 'bg-green-50 text-green-600' :
                quiz.status === 'archived' ? 'bg-gray-50 text-gray-400' :
                'bg-orange-50 text-orange-500'
              }`}>
                {quiz.status || 'draft'}
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                Created {new Date(quiz.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
              {quiz.heading}
            </h1>
            {quiz.description && (
              <p className="text-gray-500 font-medium leading-relaxed max-w-2xl">{quiz.description}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/instructor/quizzes/create?id=${quiz.id}`}>
              <Button className="flex items-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-200 transition-all">
                <Edit3 size={16} /> Edit
              </Button>
            </Link>
            <Link href={`/instructor/quizzes/${quiz.id}/grade`}>
              <Button className="flex items-center gap-2 px-6 py-4 bg-purple-100 text-purple-700 rounded-2xl font-bold text-xs hover:bg-purple-200 transition-all">
                <FileText size={16} /> Grade Essays
              </Button>
            </Link>
            <Button
              onClick={() => setActiveTab('invitations')}
              className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-blue-100"
            >
              <Send size={16} /> Invite Students
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-50">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-blue-500" />
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Invited</span>
            </div>
            <span className="text-2xl font-black text-gray-900">{invitations.length}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-green-500" />
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Submissions</span>
            </div>
            <span className="text-2xl font-black text-gray-900">{results.length}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-purple-500" />
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Avg Score</span>
            </div>
            <span className="text-2xl font-black text-gray-900">{avgScore}%</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Pass Rate</span>
            </div>
            <span className="text-2xl font-black text-gray-900">
              {results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
        {(['overview', 'results', 'invitations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'overview' && <Eye size={14} className="inline mr-2" />}
            {tab === 'results' && <BarChart3 size={14} className="inline mr-2" />}
            {tab === 'invitations' && <Mail size={14} className="inline mr-2" />}
            {tab}
          </button>
        ))}
      </div>

      {/* ─── TAB: Overview ──────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Configuration Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6">Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                {quiz.unlimited_time ? <Infinity size={20} className="text-purple-500" /> : <Clock size={20} className="text-orange-500" />}
                <div>
                  <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Time</span>
                  <span className="text-sm font-bold text-gray-900">
                    {quiz.unlimited_time ? 'Unlimited' : `${quiz.time_limit_minutes} minutes`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Target size={20} className="text-green-500" />
                <div>
                  <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Passing Score</span>
                  <span className="text-sm font-bold text-gray-900">{quiz.passing_score_percent}%</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <ListChecks size={20} className="text-blue-500" />
                <div>
                  <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Max Attempts</span>
                  <span className="text-sm font-bold text-gray-900">{quiz.max_attempts || 1}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Users size={20} className="text-purple-500" />
                <div>
                  <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Group Mode</span>
                  <span className="text-sm font-bold text-gray-900">
                    {quiz.group_mode ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              {quiz.group_mode && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <UserCheck size={20} className="text-indigo-500" />
                  <div>
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block">Leader Submit Only</span>
                    <span className="text-sm font-bold text-gray-900">
                      {quiz.only_leader_submit ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6">Results Summary</h3>
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm font-bold">No submissions yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-green-50 rounded-2xl text-center">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
                  <p className="text-3xl font-black text-green-600">{passedCount}</p>
                  <p className="text-[10px] font-bold text-green-500 tracking-widest uppercase">Passed</p>
                </div>
                <div className="p-5 bg-red-50 rounded-2xl text-center">
                  <XCircle size={24} className="mx-auto mb-2 text-red-400" />
                  <p className="text-3xl font-black text-red-500">{failedCount}</p>
                  <p className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Failed</p>
                </div>
                <div className="p-5 bg-blue-50 rounded-2xl text-center">
                  <BarChart3 size={24} className="mx-auto mb-2 text-blue-500" />
                  <p className="text-3xl font-black text-blue-600">{avgScore}%</p>
                  <p className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">Avg Score</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Results ───────────────────────────────────────────── */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {results.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Eye size={64} className="mx-auto mb-6 opacity-30" />
              <h3 className="text-xl font-black text-gray-800 mb-2">No Results Yet</h3>
              <p className="text-sm font-medium max-w-xs mx-auto">
                Results will appear here once students start submitting their assessments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">Student</th>
                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">Score</th>
                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">%</th>
                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">Status</th>
                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">Attempt</th>
                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 tracking-widest uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={r.student_id || idx} className="border-b border-gray-50 hover:bg-blue-50/20 transition-all">
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-gray-900">{r.student_name}</p>
                        <p className="text-xs text-gray-400">{r.student_email}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-black text-gray-900">
                          {r.score} / {r.total_points}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${r.passed ? 'bg-green-500' : 'bg-red-400'}`}
                              style={{ width: `${r.percentage}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black ${r.passed ? 'text-green-600' : 'text-red-500'}`}>
                            {r.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                          r.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {r.passed ? <Check size={10} className="mr-1" /> : <X size={10} className="mr-1" />}
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-gray-500">#{r.attempt_number}</span>
                      </td>
                      <td className="py-4 px-6">
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

      {/* ─── TAB: Invitations ───────────────────────────────────────── */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Mail size={20} className="text-blue-600" />
              Sent Invitations ({invitations.length})
            </h3>
            {invitations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Send size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm font-bold">No invitations sent yet</p>
                <p className="text-xs font-medium mt-1">
                  Go to the quiz editor to invite students via email.
                </p>
                <Link href={`/instructor/quizzes/create?id=${quiz.id}`} className="mt-4 inline-block">
                  <Button className="px-6 py-3">Open Quiz Editor</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {invitations.map((inv, idx) => (
                  <div
                    key={inv.id || idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-xs shadow-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900">{inv.email}</span>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Sent {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyInviteLink(inv.token)}
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-gray-400 hover:text-blue-600 tracking-widest uppercase transition-colors border border-gray-200 rounded-xl hover:border-blue-200"
                    >
                      <Copy size={12} /> Copy Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}