'use client';

import React, { useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  Eye,
  ChevronLeft,
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  ClipboardCheck,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/Button';

interface EssaySubmission {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  question_id: number;
  question_text: string;
  answer_text: string;
  points: number;
  essay_score: number | null;
  essay_feedback: string | null;
  submitted_at: string;
  quiz_question_type_id: number;
}

export default function EssayGradingPage() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const [submissions, setSubmissions] = useState<EssaySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [activeStudent, setActiveStudent] = useState<number | null>(null);
  const [grades, setGrades] = useState<Record<number, { score: number | null; feedback: string }>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  useEffect(() => {
    if (quizId) fetchSubmissions();
  }, [quizId]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch results with essay answers
      const res = await api.get(`/quiz-info/${quizId}/results`);
      const results = res.data?.results || res.data || [];

      // Extract individual essay submissions
      const essaySubs: EssaySubmission[] = [];
      results.forEach((result: any) => {
        if (result.individual_answers) {
          result.individual_answers.forEach((answer: any) => {
            if (answer.quiz_question_type_id === 2 || answer.type === 'essay' || answer.answer_text) {
              essaySubs.push({
                id: answer.id || `${result.student_id}-${answer.question_id}`,
                student_id: result.student_id,
                student_name: result.student_name || 'Unknown Student',
                student_email: result.student_email || '',
                question_id: answer.question_id || answer.quiz_question_id,
                question_text: answer.question_text || answer.question || 'Essay Question',
                answer_text: answer.answer_text || answer.student_answer || '',
                points: answer.points || answer.max_points || 10,
                essay_score: answer.essay_score !== undefined ? answer.essay_score : null,
                essay_feedback: answer.essay_feedback || null,
                submitted_at: result.submitted_at || answer.submitted_at || '',
                quiz_question_type_id: 2,
              });
            }
          });
        }
      });
      setSubmissions(essaySubs);

      // Pre-populate grades from existing data
      const existingGrades: Record<number, { score: number | null; feedback: string }> = {};
      essaySubs.forEach(sub => {
        existingGrades[sub.id] = {
          score: sub.essay_score,
          feedback: sub.essay_feedback || '',
        };
      });
      setGrades(existingGrades);
    } catch (err: any) {
      console.error('Failed to fetch essay submissions', err);
      setError(getErrorMessage(err) || 'Failed to load submissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (submissionId: number, score: number | null) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        score: score !== null ? Math.max(0, Math.min(score, submissions.find(s => s.id === submissionId)?.points || 100)) : null,
      },
    }));
  };

  const handleFeedbackChange = (submissionId: number, feedback: string) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        feedback,
      },
    }));
  };

  const handleSaveGrade = async (submissionId: number) => {
    const grade = grades[submissionId];
    if (!grade || grade.score === null) {
      setError('Please assign a score before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await api.post(`/quiz-info/${quizId}/grade-essay`, {
        submission_id: submissionId,
        score: grade.score,
        feedback: grade.feedback,
      });
      setSuccessMsg('Grade saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);

      // Update local state
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? { ...s, essay_score: grade.score, essay_feedback: grade.feedback }
            : s
        )
      );
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Failed to save grade.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllGrades = async () => {
    const gradedSubs = submissions.filter(s => grades[s.id]?.score !== null);
    if (gradedSubs.length === 0) {
      setError('No grades to save. Assign scores first.');
      return;
    }

    setIsSaving(true);
    setError(null);
    let savedCount = 0;
    for (const sub of gradedSubs) {
      try {
        await api.post(`/quiz-info/${quizId}/grade-essay`, {
          submission_id: sub.id,
          score: grades[sub.id].score,
          feedback: grades[sub.id].feedback,
        });
        savedCount++;
        setSubmissions(prev =>
          prev.map(s =>
            s.id === sub.id
              ? { ...s, essay_score: grades[sub.id].score, essay_feedback: grades[sub.id].feedback }
              : s
          )
        );
      } catch {
        // continue with next
      }
    }
    setSuccessMsg(`Saved ${savedCount} grade${savedCount !== 1 ? 's' : ''}!`);
    setTimeout(() => setSuccessMsg(null), 3000);
    setIsSaving(false);
  };

  // Group submissions by student for the overview
  const studentGroups = submissions.reduce((acc: Record<number, EssaySubmission[]>, sub) => {
    if (!acc[sub.student_id]) acc[sub.student_id] = [];
    acc[sub.student_id].push(sub);
    return acc;
  }, {});

  const filteredStudents = Object.entries(studentGroups)
    .filter(([, subs]) => {
      const studentName = subs[0]?.student_name?.toLowerCase() || '';
      const studentEmail = subs[0]?.student_email?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      return studentName.includes(term) || studentEmail.includes(term);
    })
    .filter(([, subs]) => {
      if (filterStatus === 'graded') return subs.every(s => s.essay_score !== null);
      if (filterStatus === 'ungraded') return subs.some(s => s.essay_score === null);
      return true;
    });

  const totalUngraded = submissions.filter(s => s.essay_score === null).length;
  const totalGraded = submissions.filter(s => s.essay_score !== null).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-xs font-medium text-gray-400">Loading essay submissions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <Link
          href={`/instructor/quizzes/${quizId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Quiz Details
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-4 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-600 text-xs font-black">
                Essay Grading
              </div>
              <span className="text-gray-400 font-bold text-xs">
                • Quiz #{quizId}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-[0.95] tracking-tight mb-3">
              Grade Essay<br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-400 bg-clip-text text-transparent italic text-3xl lg:text-4xl">
                Responses.
              </span>
            </h1>
            <p className="text-gray-400 font-medium max-w-xl">
              Review and score student essay submissions with detailed feedback.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center shadow-sm">
              <p className="text-2xl font-black text-amber-500">{totalUngraded}</p>
              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Ungraded</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center shadow-sm">
              <p className="text-2xl font-black text-emerald-500">{totalGraded}</p>
              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Graded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-bold">
          <CheckCircle2 size={20} />
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto p-1 hover:bg-green-100 rounded-lg">&times;</button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-purple-200 focus:ring-4 focus:ring-purple-50 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'ungraded', 'graded'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                filterStatus === status
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-700'
              }`}
            >
              <Filter size={12} className="inline mr-1" />
              {status}
            </button>
          ))}
          <Button
            onClick={handleSaveAllGrades}
            disabled={isSaving}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] tracking-widest whitespace-nowrap"
          >
            {isSaving ? <Loader2 className="animate-spin inline mr-1" size={14} /> : <Save size={14} className="inline mr-1" />}
            Save All
          </Button>
        </div>
      </div>

      {/* No Submissions */}
      {submissions.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem]">
          <FileText className="mx-auto mb-6 text-gray-200" size={80} />
          <h3 className="text-2xl font-black text-gray-800 mb-2">No Essay Submissions</h3>
          <p className="text-gray-400 font-medium max-w-md mx-auto">
            No essay responses have been submitted for this quiz yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStudents.map(([studentId, subs]) => {
            const allGraded = subs.every(s => s.essay_score !== null);
            const studentName = subs[0]?.student_name || 'Unknown Student';
            const studentEmail = subs[0]?.student_email || '';
            const firstLetter = studentName[0]?.toUpperCase() || '?';
            const isExpanded = activeStudent === Number(studentId);

            return (
              <div
                key={studentId}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                {/* Student Header */}
                <button
                  onClick={() => setActiveStudent(isExpanded ? null : Number(studentId))}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                      allGraded ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {firstLetter}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-black text-gray-900">{studentName}</h3>
                      <p className="text-xs text-gray-400 font-medium">{studentEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                      allGraded ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {allGraded ? (
                        <><CheckCircle2 size={12} className="inline mr-1" /> Graded</>
                      ) : (
                        <><AlertCircle size={12} className="inline mr-1" /> {subs.filter(s => s.essay_score === null).length} Pending</>
                      )}
                    </span>
                  </div>
                </button>

                {/* Expanded Essay Details */}
                {isExpanded && (
                  <div className="border-t border-gray-50">
                    {subs.map(sub => {
                      const grade = grades[sub.id];
                      const isGraded = sub.essay_score !== null;

                      return (
                        <div
                          key={sub.id}
                          className={`p-6 border-b border-gray-50 last:border-b-0 ${
                            expandedQuestion === sub.id ? 'bg-purple-50/20' : ''
                          }`}
                        >
                          {/* Question Header */}
                          <button
                            onClick={() => setExpandedQuestion(expandedQuestion === sub.id ? null : sub.id)}
                            className="w-full text-left flex items-start gap-3 mb-3"
                          >
                            <FileText size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-700 line-clamp-2">{sub.question_text}</p>
                              <p className="text-[10px] text-gray-400 font-medium mt-1">
                                Max {sub.points} points • Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                          </button>

                          {/* Student Answer */}
                          <div className="mb-4 ml-7">
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">
                                Student Response
                              </p>
                              <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {sub.answer_text || 'No response submitted.'}
                              </p>
                            </div>
                          </div>

                          {/* Grading Panel */}
                          <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Score Input */}
                            <div className="p-4 bg-white border border-gray-100 rounded-xl">
                              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-2">
                                Score (out of {sub.points})
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.points}
                                  value={grade?.score ?? ''}
                                  onChange={e =>
                                    handleScoreChange(
                                      sub.id,
                                      e.target.value === '' ? null : parseInt(e.target.value),
                                    )
                                  }
                                  placeholder="0"
                                  className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-center font-black text-gray-900 outline-none focus:border-purple-400"
                                />
                                <span className="text-sm font-bold text-gray-400">/ {sub.points}</span>
                                {grade?.score !== null && (
                                  <span
                                    className={`text-xs font-black ${
                                      (grade.score! / sub.points) >= 0.7
                                        ? 'text-emerald-600'
                                        : (grade.score! / sub.points) >= 0.5
                                        ? 'text-amber-600'
                                        : 'text-red-500'
                                    }`}
                                  >
                                    ({Math.round((grade.score! / sub.points) * 100)}%)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Feedback Input */}
                            <div className="p-4 bg-white border border-gray-100 rounded-xl">
                              <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-2">
                                Feedback
                              </label>
                              <textarea
                                placeholder="Provide constructive feedback..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-medium outline-none focus:border-purple-400 resize-none"
                                rows={2}
                                value={grade?.feedback || ''}
                                onChange={e => handleFeedbackChange(sub.id, e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Save Button */}
                          <div className="ml-7 mt-3 flex items-center justify-end gap-3">
                            {isGraded && (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Graded: {sub.essay_score}/{sub.points}
                              </span>
                            )}
                            <Button
                              onClick={() => handleSaveGrade(sub.id)}
                              disabled={isSaving || grade?.score === null}
                              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-black text-[10px] tracking-widest"
                            >
                              {isSaving ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <>
                                  <Save size={14} className="inline mr-1" /> {isGraded ? 'Update Grade' : 'Save Grade'}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty filter results */}
      {submissions.length > 0 && filteredStudents.length === 0 && (
        <div className="text-center py-16 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem]">
          <Search className="mx-auto mb-4 text-gray-200" size={48} />
          <h3 className="text-xl font-black text-gray-800 mb-2">No matching submissions</h3>
          <p className="text-gray-400 font-medium">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}