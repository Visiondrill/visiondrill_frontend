'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api, getCsrfCookie } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  Layout, 
  Users, 
  Globe, 
  Trash2, 
  ChevronLeft, 
  Loader2, 
  CheckCircle, 
  EyeOff,
  ChevronRight,
  TrendingUp,
  Settings as SettingsIcon,
  ShieldCheck
} from 'lucide-react';
import Button from '@/components/Button';

export default function InstructorCourseDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Edit states
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editLevel, setEditLevel] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        await getCsrfCookie();
        const [courseRes, studentsRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/instructor/courses/${id}/students`),
          getCsrfCookie()
        ]);
        const data = courseRes.data;
        setCourse(data);
        setEditTitle(data.course_title);
        setEditPrice((data.price / 100).toString());
        setEditLevel(data.level || 'beginner');
        setStudents(studentsRes.data.students || []);
      } catch (err) {
        console.error('Failed to fetch course details', err);
      } finally {
        setIsLoading(false);
        setStudentsLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await api.put(`/instructor/courses/${id}`, {
        course_title: editTitle,
        price: parseFloat(editPrice) * 100, // Convert back to cents
        level: editLevel
      });
      // Refresh local course state
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    const endpoint = course.status === 'PUBLISHED'
      ? `/instructor/courses/${id}/unpublish`
      : `/instructor/courses/${id}/publish`;
    try {
      const res = await api.post(endpoint);
      setCourse({ ...course, status: res.data.status });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to change status");
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this course permanently?')) return;
    await api.delete(`/instructor/courses/${id}`);
    router.push('/instructor/courses');
  };

  const checklist = useMemo(() => {
    if (!course) return [];
    return [
      { id: 1, label: 'Course Title & Info', completed: !!course.course_title },
      { id: 2, label: 'Curriculum (min 1 section)', completed: (course.sections?.length || 0) > 0 },
      { id: 3, label: 'Lessons populated', completed: (course.sections || []).some((s: any) => (s.lessons?.length || 0) > 0) },
      { id: 4, label: 'Pricing configured', completed: course.price >= 0 },
      { id: 5, label: 'Thumbnail uploaded', completed: !!course.thumbnail },
    ];
  }, [course]);

  const isReadyToPublish = checklist.every(item => item.completed);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Course not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/instructor/courses" className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-400">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-black text-gray-900 tracking-tight leading-none">{course.course_title}</h1>
            <p className="text-xs text-gray-400 font-black mt-1">Course Management Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePublishToggle}
            className={`px-6 py-3 rounded-2xl font-black text-xs transition-all ${
              course.status === 'PUBLISHED'
                ? 'bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200'
                : isReadyToPublish 
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-xl shadow-green-100'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {course.status === 'PUBLISHED' ? 'Unpublish Course' : 'Publish Course'}
          </button>
          <button onClick={handleDelete} className="p-3 rounded-xl border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all">
            <Trash2 size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Form & Stats */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 bg-blue-500/5 blur-3xl rounded-full -mr-20 -mt-20"></div>
               <div className="relative z-10 flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                     <SettingsIcon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Configuration</h3>
               </div>
               
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 ml-2 block">Course Title</label>
                        <input 
                           type="text" 
                           value={editTitle}
                           onChange={e => setEditTitle(e.target.value)}
                           className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-400 ml-2 block">Price (USD)</label>
                           <input 
                              type="number" 
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-gray-400 ml-2 block">Level</label>
                           <select 
                              value={editLevel}
                              onChange={e => setEditLevel(e.target.value)}
                              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none"
                           >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                           </select>
                        </div>
                     </div>
                     <Button onClick={handleUpdate} isLoading={isSaving} className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2">
                         Save Configuration
                     </Button>
                  </div>

                  <div className="bg-gray-50 rounded-[2.5rem] p-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 group transition-all hover:border-blue-200">
                     <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl shadow-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-500 transition-colors mb-6 overflow-hidden">
                        {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : <Globe size={48} />}
                     </div>
                     <button className="text-xs font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all">
                        Update Media
                     </button>
                  </div>
               </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                     <Layout size={24} className="text-purple-600" /> Curriculum Blueprint
                  </h3>
                  <Link href={`/instructor/courses/${id}/curriculum`}>
                     <Button className="px-6 h-12 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white text-xs font-black rounded-xl transition-all shadow-none">Manage Modules</Button>
                  </Link>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(course.sections || []).map((s: any, idx: number) => (
                     <div key={s.id} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-purple-50 hover:border-purple-100 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center font-black text-xs text-gray-900 shadow-sm">{idx + 1}</div>
                           <div>
                              <h5 className="font-black text-gray-900 tracking-tight text-sm truncate max-w-[150px]">{s.title}</h5>
                              <p className="text-xs font-medium text-gray-400">{s.lessons?.length || 0} Lessons</p>
                           </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-200 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                     </div>
                  ))}
                  {(!course.sections || course.sections.length === 0) && (
                     <div className="col-span-2 py-12 text-center text-gray-300 font-black text-xs border-2 border-dashed border-gray-50 rounded-3xl">
                        Design your first module
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* Checklist & Students */}
          <div className="space-y-8">
             <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm">
                <h3 className="text-xs font-medium text-gray-400 mb-8 flex items-center gap-2">
                   <ShieldCheck size={14} className="text-green-500" /> Quality Control
                </h3>
                <div className="space-y-6">
                   {checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-4">
                         <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${item.completed ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'border-2 border-gray-50 text-transparent'}`}>
                            {item.completed && <CheckCircle size={14} />}
                         </div>
                         <span className={`text-xs font-black tracking-tight ${item.completed ? 'text-gray-900' : 'text-gray-300'}`}>{item.label}</span>
                      </div>
                   ))}
                </div>
                {!isReadyToPublish && (
                   <div className="mt-10 p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100">
                      <p className="text-xs font-black text-orange-700 leading-relaxed">
                         Course is currently hidden from enrollment. Please complete the blueprint.
                      </p>
                   </div>
                )}
             </div>

             <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm">
                <h3 className="text-xs font-medium text-gray-400 mb-8 flex items-center justify-between">
                   <span className="flex items-center gap-2"> <TrendingUp size={14} className="text-purple-500" /> Global Roster</span>
                   <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full">{students.length}</span>
                </h3>
                <div className="space-y-5 max-h-[400px] overflow-y-auto no-scrollbar">
                   {students.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-4 group">
                         <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                            {s.name[0]}
                         </div>
                         <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate tracking-tight">{s.name}</p>
                            <p className="text-xs font-medium text-gray-400 truncate">{s.email}</p>
                         </div>
                      </div>
                   ))}
                   {students.length === 0 && <p className="text-center py-12 text-xs font-medium text-gray-300 italic">Awaiting first enrollment</p>}
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
