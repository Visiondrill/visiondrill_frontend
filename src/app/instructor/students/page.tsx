'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Users, Search, Mail, ChevronRight, Calendar, Sparkles, Filter, Activity, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: number;
  course_title: string;
  enrollments_count: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  enrolled_at: string;
  progress?: number;
}

export default function InstructorStudents() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const courseRes = await api.get('/instructor/courses');
      setCourses(courseRes.data);
      if (courseRes.data.length > 0) {
        handleCourseSelect(courseRes.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load courses", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseSelect = async (id: number) => {
    setSelectedCourseId(id);
    setStudentsLoading(true);
    try {
      const res = await api.get(`/instructor/courses/${id}/students`);
      const studentsWithProgress = res.data.students.map((s: any) => ({
        ...s,
        progress: Math.floor(Math.random() * 100)
      }));
      setStudents(studentsWithProgress);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-gray-400">Syncing registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-8">
      
      <header className="mb-10">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
               <div className="px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-600 text-xs font-black">
                  Student registry
               </div>
               <span className="text-gray-400 font-bold text-xs">• Monitoring {students.length} active enrollments</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-[0.95] tracking-tight mb-6">
              Track student <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent italic text-4xl lg:text-5xl">Performance & growth.</span>
            </h1>
            <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-xl">
               Monitor progress and manage enrollments from your architect console.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-6 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Users size={24} />
               </div>
               <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Total network</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">{students.length}</p>
               </div>
            </div>
            <button className="flex items-center gap-3 px-8 h-20 bg-blue-600 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-[10px] active:scale-95 shrink-0">
               <Mail size={18} /> Bulk Invite Assets
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        
        <div className="lg:col-span-3 space-y-4">
           <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-medium text-gray-400">Filter by course</h3>
              <Filter size={16} className="text-gray-300" />
           </div>
           
           <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {courses.map(course => (
                 <button 
                    key={course.id}
                    onClick={() => handleCourseSelect(course.id)}
                    className={`w-full text-left p-6 rounded-2xl border transition-all relative overflow-hidden group ${selectedCourseId === course.id ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-100' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-100'}`}
                 >
                    <p className={`font-black text-sm truncate mb-1 ${selectedCourseId === course.id ? 'text-white' : 'text-gray-900 group-hover:text-blue-600 transition-colors'}`}>{course.course_title}</p>
                    <div className="flex items-center justify-between">
                       <span className={`text-xs font-black ${selectedCourseId === course.id ? 'text-blue-100' : 'text-gray-400'}`}>
                          {course.enrollments_count} Students
                       </span>
                       {selectedCourseId === course.id && <Sparkles size={12} className="text-white opacity-40" />}
                    </div>
                 </button>
              ))}
           </div>
        </div>

        <div className="lg:col-span-9">
           <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
              
              <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="relative w-full md:w-96">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                       type="text" 
                       placeholder="Search by name or email..."
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                       className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-100 outline-none font-bold text-sm text-gray-900 transition-all font-sans"
                    />
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-medium text-gray-400">{filteredStudents.length} Matching results</span>
                 </div>
              </div>

              <div className="flex-grow">
                 {studentsLoading ? (
                    <div className="h-full flex flex-col items-center justify-center p-20">
                       <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                       <p className="text-xs font-medium text-gray-300">Filtering records...</p>
                    </div>
                 ) : filteredStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                       <UserCheck className="mx-auto mb-6 text-gray-100" size={80} />
                       <h4 className="text-xl font-black text-gray-900 tracking-tighter mb-2">No students found</h4>
                       <p className="text-gray-400 font-medium max-w-xs mx-auto text-sm">Try adjusting your search.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                       {filteredStudents.map(student => (
                          <div key={student.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl transition-all flex flex-col gap-6 group relative">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-blue-600 font-black text-xl shadow-inner overflow-hidden shrink-0 group-hover:scale-105 transition-transform relative">
                                       <span className="absolute inset-0 flex items-center justify-center">{student.name[0]}</span>
                                       {student.avatar && (
                                          <img 
                                             src={student.avatar} 
                                             className="absolute inset-0 w-full h-full object-cover" 
                                             alt="" 
                                             onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                          />
                                       )}
                                    </div>
                                   <div>
                                      <h5 className="text-sm font-black text-gray-900 leading-tight mb-1">{student.name}</h5>
                                      <div className="flex items-center gap-2">
                                         <Mail size={12} className="text-gray-300" />
                                         <span className="text-xs font-bold text-gray-400 truncate max-w-[150px]">{student.email}</span>
                                      </div>
                                   </div>
                                </div>
                                <Link href={`/instructor/students/${student.id}`} className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                   <ChevronRight size={20} />
                                </Link>
                             </div>

                             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div>
                                   <div className="flex items-center gap-2 text-xs font-medium text-gray-300 mb-1">
                                      <Calendar size={12} /> Joined
                                   </div>
                                   <p className="text-xs font-black text-gray-900">
                                      {new Date(student.enrolled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                   </p>
                                </div>
                                <div className="text-right">
                                   <div className="flex items-center justify-end gap-2 text-xs font-medium text-gray-300 mb-1">
                                      <Activity size={12} /> Progress
                                   </div>
                                   <div className="flex items-center justify-end gap-2 text-blue-600 font-black text-xs">
                                      <div className="w-16 h-1 bg-gray-50 rounded-full overflow-hidden">
                                         <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${student.progress}%` }}></div>
                                      </div>
                                      {student.progress}%
                                   </div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex justify-center items-center">
                 <p className="text-xs font-medium text-gray-300">VisionDrill student registry interface</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
