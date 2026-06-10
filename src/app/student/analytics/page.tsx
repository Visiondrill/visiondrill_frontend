'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  BarChart3,
  TrendingUp, 
  Activity, 
  Award, 
  Target,
  Zap,
  Globe,
  Loader2,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function StudentAnalyticsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coursesRes, progressRes] = await Promise.all([
          api.get('/student/dashboard-stats'),
          api.get('/student/courses'),
          api.get('/student/analytics/progress')
        ]);
        if (progressRes.data) {
          // Merge detailed progress into courses if available
          const progressMap = new Map(progressRes.data.map((p: any) => [p.course_id, p]));
          coursesRes.data = coursesRes.data.map((c: any) => ({
            ...c,
            detailed_progress: progressMap.get(c.id) || null
          }));
        }
        setStats(statsRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        console.error("Telemetry link failure:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="text-blue-500 animate-spin" size={32} />
        <p className="text-sm font-semibold text-gray-400">Syncing performance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold rounded-lg  tracking-wider">
                 Learning Analytics
              </div>
           </div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">Performance analysis</h1>
           <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-xl">
             Comprehensive overview of your study patterns, mastery progression, and course performance.
           </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricCard 
            label="Total study time" 
            value={`${stats?.hours_learned || 0}h`} 
            icon={Zap} 
            color="text-amber-500" 
            bg="bg-amber-50"
            desc="Cumulative time across all modules."
         />
         <MetricCard
            label="Average score"
            value={typeof stats?.average_score === 'number' ? `${stats.average_score.toFixed(1)}%` : '—'}
            icon={Target}
            color="text-blue-600"
            bg="bg-blue-50"
            desc="Weighted avg from quiz evaluations."
         />
         <MetricCard 
            label="Certifications" 
            value={(stats?.certificates_earned || 0).toString().padStart(2, '0')} 
            icon={Award} 
            color="text-purple-600" 
            bg="bg-purple-50"
            desc="Modules fully completed."
         />
      </div>

      {/* Course Detail List */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm shadow-gray-100/50">
         <div className="p-8 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
               <Activity className="text-blue-600" size={20} /> Course metrics
            </h3>
         </div>
         
         <div className="overflow-x-auto font-sans">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                     <th className="px-8 py-5 text-xs font-bold text-gray-400  tracking-widest">Course node</th>
                     <th className="px-8 py-5 text-xs font-bold text-gray-400  tracking-widest text-center">Progress</th>
                     <th className="px-8 py-5 text-xs font-bold text-gray-400  tracking-widest text-center">Score</th>
                     <th className="px-8 py-5 text-xs font-bold text-gray-400  tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {courses.map((course) => (
                    <tr key={course.id} className="group hover:bg-gray-50/50 transition-all">
                       <td className="px-8 py-6">
                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{course.course_title}</p>
                          <p className="text-xs font-medium text-gray-400 mt-1">Instructor: Platform Expert</p>
                       </td>
                       <td className="px-8 py-6 w-64">
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${course.progress_percentage || 0}%` }} />
                             </div>
                             <span className="text-xs font-sans font-bold text-gray-600">{course.progress_percentage || 0}%</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <span className="font-sans font-bold text-gray-900">82.4</span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <Link href={`/student/learn/${course.id}`}>
                             <button className="p-2 hover:bg-blue-50 text-gray-300 hover:text-blue-600 rounded-xl transition-all">
                                <ArrowRight size={20} />
                             </button>
                          </Link>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {courses.length === 0 && (
               <div className="p-20 text-center text-gray-400 font-medium italic">No active telemetry available.</div>
            )}
         </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, bg, desc }: any) {
  return (
    <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group">
       <div className="flex items-center justify-between mb-8">
          <div className={`p-4 rounded-2xl ${bg} ${color}`}>
             <Icon size={24} />
          </div>
          <Activity className="text-gray-100 group-hover:text-gray-200 transition-colors" size={32} />
       </div>
       <div className="text-4xl font-black text-gray-900 tracking-tighter mb-2 font-sans">{value}</div>
       <p className="text-sm font-bold text-gray-900  tracking-wide mb-1">{label}</p>
       <p className="text-xs font-medium text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
