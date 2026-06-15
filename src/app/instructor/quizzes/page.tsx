'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Quiz } from '@/types/quiz';
import {
  Sparkles, Plus, Search, Eye, Send, Clock, Infinity, Users,
  Loader2, ChevronRight, Calendar, Target, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/Button';

export default function InstructorQuizzesDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      // Fetch all quizzes for the instructor
      const res = await api.get('/quiz-info');
      setQuizzes(res.data?.quizzes || res.data || []);
    } catch (err) {
      console.error('Failed to fetch quizzes', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.heading?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-xs font-medium text-gray-400">Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-600 text-xs font-black">
                Assessment Center
              </div>
              <span className="text-gray-400 font-bold text-xs">
                • {quizzes.length} quizzes managed
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight mb-6">
              Quiz & Assessment<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent italic text-4xl lg:text-5xl">
                Command Center.
              </span>
            </h1>
            <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-xl">
              Create, distribute, and monitor all your assessments from one central console.
            </p>
          </div>

          <Link href="/instructor/quizzes/create">
            <Button className="flex items-center gap-3 px-8 h-16 bg-blue-600 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-[11px] active:scale-95">
              <Plus size={20} /> Create New Quiz
            </Button>
          </Link>
        </div>
      </header>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
          />
        </div>
      </div>

      {/* Quiz Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem]">
          <Sparkles className="mx-auto mb-6 text-gray-200" size={80} />
          <h3 className="text-2xl font-black text-gray-800 mb-2">
            {searchTerm ? 'No matching quizzes' : 'No quizzes yet'}
          </h3>
          <p className="text-gray-400 font-medium mb-8 max-w-md mx-auto">
            {searchTerm
              ? 'Try adjusting your search terms.'
              : 'Start building your first assessment to evaluate student performance.'}
          </p>
          {!searchTerm && (
            <Link href="/instructor/quizzes/create">
              <Button className="px-8 py-4">Create Your First Quiz</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredQuizzes.map(quiz => (
            <Link
              key={quiz.id}
              href={`/instructor/quizzes/${quiz.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                    quiz.status === 'active'
                      ? 'bg-green-50 text-green-600'
                      : quiz.status === 'archived'
                      ? 'bg-gray-50 text-gray-400'
                      : 'bg-orange-50 text-orange-500'
                  }`}
                >
                  {quiz.status || 'draft'}
                </span>
                <ChevronRight
                  size={18}
                  className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                />
              </div>

              {/* Title */}
              <h3 className="text-lg font-black text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {quiz.heading}
              </h3>

              {/* Meta Stats */}
              <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  {quiz.unlimited_time ? (
                    <Infinity size={14} className="text-purple-400" />
                  ) : (
                    <Clock size={14} className="text-orange-400" />
                  )}
                  <span className="text-[10px] font-bold text-gray-400">
                    {quiz.unlimited_time ? 'No limit' : `${quiz.time_limit_minutes}m`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-green-400" />
                  <span className="text-[10px] font-bold text-gray-400">
                    {quiz.passing_score_percent}% pass
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-blue-400" />
                  <span className="text-[10px] font-bold text-gray-400">
                    {quiz.invitations_count || 0} invited
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Send size={14} className="text-purple-400" />
                  <span className="text-[10px] font-bold text-gray-400">
                    {quiz.submissions_count || 0} submitted
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                <Calendar size={12} className="text-gray-300" />
                <span className="text-[10px] font-medium text-gray-400">
                  {new Date(quiz.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}