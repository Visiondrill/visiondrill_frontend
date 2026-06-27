'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShieldCheck,
  Video,
  Search,
  Sparkles,
  Mail,
  Clock
} from 'lucide-react';
import Button from '@/components/Button';
import CourseAvatar from '@/components/CourseAvatar';
import RichTextEditor from '@/components/RichTextEditor';


export default function InstructorCourseDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded Edit states
  const [form, setForm] = useState({
    course_title: '',
    subtitle: '',
    description: '',
    price: '',
    level: 'beginner',
    category_id: '',
    type: 'public',
    meta_title: '',
    meta_tags: '',
    meta_description: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [courseRes, studentsRes, catRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/instructor/courses/${id}/students`).catch(() => ({ data: { students: [] } })),
          api.get('/instructor/categories').catch(() => ({ data: [] }))
        ]);
        
        const data = courseRes.data;
        setCourse(data);
        setCategories(catRes.data);
        setForm({
          course_title: data.course_title || '',
          subtitle: data.subtitle || '',
          description: data.description || '',
          price: (data.price / 100).toString() || '0',
          level: data.level || 'beginner',
          category_id: data.category_id?.toString() || '',
          type: data.type || 'public',
          meta_title: data.meta_title || '',
          meta_tags: data.meta_tags || '',
          meta_description: data.meta_description || ''
        });
        setStudents(studentsRes.data.students || []);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await api.put(`/instructor/courses/${id}`, {
        ...form,
        price: parseFloat(form.price) * 100, // Convert to cents
        category_id: form.category_id ? parseInt(form.category_id) : null
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

  const handleSubmitForReview = async () => {
    if (!course) return;
    
    const incompleteItems = checklist.filter(item => !item.completed);
    if (incompleteItems.length > 0) {
      const labels = incompleteItems.map(i => i.label).join(", ");
      alert(`Please complete the following requirements before submitting: ${labels}`);
      return;
    }
    
    try {
      // Use existing IN_REVIEW status from model
      const res = await api.post(`/instructor/courses/${id}/publish`);
      setCourse({ ...course, status: 'IN_REVIEW' });
      alert("Your course has been submitted for admin review!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit for review");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post(`/instructor/courses/${id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCourse((prev: any) => ({ ...prev, thumbnail: res.data.thumbnail }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      { id: 1, label: 'Course Title', completed: !!course.course_title },
      { id: 6, label: 'Subtitle', completed: !!course.sub_title },
      { id: 7, label: 'Description', completed: !!course.description && course.description.length > 20 },
      { id: 8, label: 'Category', completed: !!course.category_id },
      { id: 2, label: 'Curriculum (min 1 section)', completed: (course.sections?.length || 0) > 0 },
      { id: 3, label: 'Lessons populated', completed: (course.sections || []).some((s: any) => (s.lessons?.length || 0) > 0) },
      { id: 4, label: 'Pricing configured', completed: course.price >= 0 },
      { id: 5, label: 'Thumbnail uploaded', completed: !!course.thumbnail },
      { id: 9, label: 'SEO Metadata', completed: !!course.title && !!course.meta_description },
    ];
  }, [course]);

  const isReadyToPublish = checklist.every(item => item.completed);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Course not found.</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFF]">
      <nav className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white sticky top-0 z-[60] shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/instructor/courses" className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all text-gray-400">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-black text-gray-900 tracking-tight leading-none">{course.course_title}</h1>
            <p className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-widest leading-none">Course Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/courses/${course.slug}`} 
            target="_blank"
            className="flex items-center gap-2 px-6 h-12 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all"
          >
            <BookOpen size={14} /> Preview
          </Link>

          <button
            onClick={handleSubmitForReview}
            disabled={course.status === 'PUBLISHED' || course.status === 'IN_REVIEW'}
            className={`px-8 h-12 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2 ${
              course.status === 'PUBLISHED' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                : course.status === 'IN_REVIEW'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : isReadyToPublish
                    ? 'bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'
            }`}
          >
            {course.status === 'PUBLISHED' ? <><Globe size={14} /> Course Live</> : 
             course.status === 'IN_REVIEW' ? <><Clock size={14} /> Under Review</> : 
             <><Sparkles size={14} /> Submit for Review</>}
          </button>
          
          <button onClick={handleDelete} className="p-3 hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all border border-transparent hover:border-red-100 rounded-2xl">
            <Trash2 size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Context Pane */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Box 1: Details */}
            <SectionBox title="DETAILS | CHANGE INFORMATION ABOUT YOUR COURSE" icon={<SettingsIcon size={20} />}>
               <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course Category</label>
                       <select 
                          value={form.category_id}
                          onChange={e => setForm({...form, category_id: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all appearance-none"
                       >
                          <option value="">Select a category...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course Name</label>
                       <input 
                          type="text" 
                          value={form.course_title}
                          onChange={e => setForm({...form, course_title: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course Subtitle</label>
                    <input 
                        type="text" 
                        value={form.subtitle}
                        onChange={e => setForm({...form, subtitle: e.target.value})}
                        placeholder="e.g. Master the art of photography in 30 days..."
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course Level</label>
                       <select 
                          value={form.level}
                          onChange={e => setForm({...form, level: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all appearance-none"
                       >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course Type</label>
                       <select 
                          value={form.type}
                          onChange={e => setForm({...form, type: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all appearance-none"
                       >
                          <option value="public">Public (Earn Money)</option>
                          <option value="private">Private (Invite Only)</option>
                       </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">What students will learn?</label>
                    <RichTextEditor
                        placeholder="Describe what students will learn..."
                        content={form.description}
                        onChange={val => setForm({...form, description: val})}
                        minHeight="200px"
                    />
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course Price</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">$</span>
                       <input 
                          type="number" 
                          value={form.price}
                          onChange={e => setForm({...form, price: e.target.value})}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                       />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                     <Button onClick={handleUpdate} isLoading={isSaving} className="px-10 h-14 bg-gray-950 hover:bg-black text-white text-[10px] font-black tracking-widest uppercase rounded-2xl">Save Changes</Button>
                  </div>
               </div>
            </SectionBox>

            {/* Box 2: SEO */}
            <SectionBox title="SEO | IMPROVE THE SEARCH ENGINE FRIENDLINESS OF YOUR COURSE PAGE" icon={<Globe size={20} />}>
               <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                    <input 
                        type="text" 
                        value={form.meta_title}
                        onChange={e => setForm({...form, meta_title: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                        placeholder="Enter meta title..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta Tags</label>
                    <input 
                        type="text" 
                        value={form.meta_tags}
                        onChange={e => setForm({...form, meta_tags: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                        placeholder="Enter meta tags..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta Description</label>
                    <textarea 
                        rows={3}
                        value={form.meta_description}
                        onChange={e => setForm({...form, meta_description: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                        placeholder="Enter meta description..."
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                     <Button onClick={handleUpdate} isLoading={isSaving} className="px-10 h-14 bg-gray-950 hover:bg-black text-white text-[10px] font-black tracking-widest uppercase rounded-2xl">Save SEO Settings</Button>
                  </div>
               </div>
            </SectionBox>

            {/* Box 3: Branding */}
            <SectionBox title="BRANDING" icon={<Sparkles size={20} />}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Course Preview Video</label>
                     <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center p-8 group hover:border-blue-200 transition-all cursor-pointer">
                        <Video className="text-gray-200 group-hover:text-blue-500 mb-4 transition-colors" size={48} />
                        <p className="text-[10px] font-black text-gray-400 leading-relaxed tracking-widest">DRAG OR DROP <span className="text-blue-600">BROWSE</span></p>
                        <p className="text-[8px] font-bold text-gray-300 mt-2">Unlimited Size</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Course Thumbnail Image</label>
                     <div className="relative group">
                        <div className="aspect-video rounded-[2rem] overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                           <CourseAvatar
                              title={course.course_title}
                              thumbnail={course.thumbnail}
                              className="w-full h-full"
                              imgClassName="w-full h-full object-cover"
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                              <button 
                                 onClick={() => fileInputRef.current?.click()}
                                 className="px-6 py-2 bg-white text-gray-900 rounded-full font-black text-[10px] tracking-widest uppercase shadow-xl active:scale-95 transition-all"
                              >
                                 Update Image
                              </button>
                           </div>
                        </div>
                        <input
                           ref={fileInputRef}
                           type="file"
                           className="hidden"
                           onChange={handleImageUpload}
                           accept="image/*"
                        />
                     </div>
                     <p className="text-[9px] font-bold text-gray-400 text-center tracking-widest">Recommended size: 1280x720 (16:9)</p>
                  </div>
               </div>
            </SectionBox>

            {/* Box 4: Co-Authors */}
            <SectionBox title="[ CO-AUTHORS ] INVITE CO-AUTHORS FOR THIS COURSE" icon={<Users size={20} />}>
               <div className="space-y-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                     <div className="relative">
                        <input 
                           type="email" 
                           placeholder="Enter email address. You can add multiple emails by pressing enter"
                           className="w-full px-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Existing Co-authors</span>
                     <div className="bg-gray-50/50 rounded-2xl border border-gray-50 p-8 text-center text-[10px] font-bold text-gray-300 tracking-widest">
                        NO OTHER MAN IS PART TO THIS COURSE FOR YET
                     </div>
                  </div>

                  <div className="flex justify-end">
                     <button className="px-8 h-12 border border-blue-100 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl font-black text-[10px] tracking-widest uppercase transition-all">Send Invitation</button>
                  </div>
               </div>
            </SectionBox>
          </div>

          {/* Checklist Pane */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 flex items-center gap-3">
                   <ShieldCheck size={16} className="text-emerald-500" /> Quality Assurance
                </h3>
                <div className="space-y-8">
                   {checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-4 group">
                         <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-50/50' : 'bg-gray-50 border border-gray-100 text-transparent'}`}>
                            {item.completed && <CheckCircle size={16} />}
                         </div>
                         <div className="flex flex-col">
                            <span className={`text-[11px] font-black tracking-tight ${item.completed ? 'text-gray-900 line-through opacity-40' : 'text-gray-900'}`}>{item.label}</span>
                            {!item.completed && <Link href={item.id === 2 || item.id === 3 ? `/instructor/courses/${id}/curriculum` : '#'} className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-0.5 hover:underline decoration-2 underline-offset-4">Fix issue <ChevronRight size={8} className="inline" /></Link>}
                         </div>
                      </div>
                   ))}
                </div>
                
                <div className={`mt-12 p-6 rounded-[2rem] border transition-all ${isReadyToPublish ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                   <p className={`text-[10px] font-black leading-relaxed tracking-tight ${isReadyToPublish ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {isReadyToPublish 
                        ? "Course blueprint meets all quality standards. Ready for review." 
                        : "Your course is currently in draft mode. Complete all requirements to submit for review."}
                   </p>
                </div>
             </div>

             <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 flex items-center justify-between">
                   <span className="flex items-center gap-3"> <TrendingUp size={16} className="text-blue-500" /> Active Roster</span>
                   <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full">{students.length}</span>
                </h3>
                <div className="space-y-4">
                   {students.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all cursor-default">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-sm text-gray-900 shadow-sm">
                            {s.name[0]}
                         </div>
                         <div className="min-w-0">
                            <p className="text-[11px] font-black text-gray-900 truncate tracking-tight">{s.name}</p>
                            <p className="text-[9px] font-medium text-gray-400 truncate tracking-tight">{s.email}</p>
                         </div>
                      </div>
                   ))}
                   {students.length === 0 && <p className="text-center py-10 text-[10px] font-black text-gray-300 italic tracking-[0.2em] uppercase">No active students yet</p>}
                </div>
             </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-gray-100">
         <p className="text-[10px] font-black text-gray-300 text-center tracking-[0.3em] uppercase">2026 Powered By — Visiondrill</p>
      </footer>
    </div>
  );
}

function SectionBox({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
   return (
      <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-700">
         <div className="bg-blue-600 px-10 py-5 flex items-center gap-4">
            <div className="text-white opacity-80">{icon}</div>
            <h3 className="text-[10px] font-black text-white tracking-[0.2em] uppercase leading-none">{title}</h3>
         </div>
         <div className="p-10">
            {children}
         </div>
      </div>
   );
}
