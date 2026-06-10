'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sanitizeHtml } from '@/lib/sanitize';
import Button from '@/components/Button';
import {
  User,
  Clock,
  Eye,
  CheckCircle,
  ChevronDown,
  Play,
  PlayCircle,
  FileText,
  HelpCircle,
  Users,
  Star,
  Award,
  Globe,
  Activity,
  ArrowRight,
  Cpu,
  Target
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

interface Lesson {
  id: number;
  title: string;
  content_type: string;
}

interface Section {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: number;
  slug: string;
  course_title: string;
  description: string;
  view: number;
  level: string;
  duration: string;
  enrollments_count: number;
  author: {
    fullname: string;
    picture: string;
    short_description: string;
    long_description: string;
  };
  sections: Section[];
}

const CourseDetailPage = () => {
  const { slug } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${slug}`);
        setCourse(response.data);
        if (response.data.sections.length > 0) {
          setExpandedSections([response.data.sections[0].id]);
        }
        // Fetch reviews and rating stats in parallel
        const courseId = response.data.id;
        const [reviewsRes, ratingRes] = await Promise.all([
          api.get(`/courses/${courseId}/reviews`).catch(() => ({ data: [] })),
          api.get(`/courses/${courseId}/rating-stat`).catch(() => ({ data: null }))
        ]);
        setReviews(reviewsRes.data || []);
        setRatingStats(ratingRes.data);
      } catch (error) {
        console.error('Failed to fetch course details', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  const toggleSection = (id: number) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
       <Loader />
       <p className="mt-4 text-[10px] font-black  tracking-[0.3em] text-gray-400 animate-pulse">Syncing Course Repository...</p>
    </div>
  );

  if (!course) return <div className="h-screen flex items-center justify-center">Course not found</div>;

  return (
    <main className="min-h-screen bg-[#FDFDFF] pb-32">
      {/* Premium Hero Section */}
      <div className="bg-[#0F172A] pt-40 pb-32 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[1000px] h-full bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.1),transparent)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                 <div className="px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-[10px] font-black  tracking-widest">
                    Verified Professional Path
                 </div>
                 <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" className="opacity-30" />
                    <span className="text-white/40 text-[10px] font-black  tracking-widest ml-2">(4.9/5)</span>
                 </div>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-black mb-10 leading-[0.95] tracking-tight text-white  italic">
                {course.course_title}
              </h1>

              <div className="flex flex-wrap items-center gap-10 mb-12">
                <div className="flex items-center gap-4 group cursor-default">
                  <img src={course.author.picture} className="w-12 h-12 rounded-2xl border-2 border-white/10 group-hover:rotate-12 transition-transform object-cover" alt="" />
                  <div>
                    <p className="text-[10px] font-black text-white/40  tracking-widest leading-none mb-1">Architected By</p>
                    <p className="text-sm font-black text-white tracking-tight underline decoration-blue-600/50 underline-offset-4">{course.author.fullname}</p>
                  </div>
                </div>
                
                <div className="h-10 w-px bg-white/10 hidden sm:block"></div>

                <div className="flex items-center gap-8 text-[10px] font-black  tracking-widest text-white/60">
                   <div className="flex items-center gap-2"><Clock size={16} className="text-blue-500" /> {course.duration || '12.5h Content'}</div>
                   <div className="flex items-center gap-2"><Globe size={16} className="text-blue-500" /> English & Swahili</div>
                   <div className="flex items-center gap-2"><Activity size={16} className="text-blue-500" /> {course.level}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                 {['Certificate', 'Code Repository', 'Assignments', 'Q&A Support'].map(badge => (
                    <span key={badge} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black  tracking-[0.2em] text-white/50">{badge}</span>
                 ))}
              </div>
            </div>
            
            {/* Action Sidebar: Udemy Style Premium Card */}
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
               <div className="relative bg-white rounded-[3rem] p-4 text-gray-900 border border-gray-100 shadow-2xl overflow-hidden scale-105">
                 <div className="relative aspect-video rounded-[2.5rem] overflow-hidden mb-8 group/img cursor-pointer">
                    <img src={course.sections?.[0]?.lessons?.[0] ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110 opacity-90" alt="" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-colors group-hover/img:bg-black/10">
                       <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover/img:scale-110">
                         <Play fill="currentColor" className="text-blue-600 ml-1" size={24} />
                       </div>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 p-4 glass rounded-2xl text-center">
                       <span className="text-[10px] font-black  tracking-[0.3em] text-black">Preview Syllabus</span>
                    </div>
                 </div>

                 <div className="px-6 pb-6">
                    <div className="flex items-center gap-4 mb-8">
                       <span className="text-4xl font-black tracking-tighter">$49.99</span>
                       <span className="text-xl text-gray-300 line-through font-bold tracking-tighter">$129.00</span>
                    </div>

                    <div className="space-y-3 mb-8">
                       <Button onClick={() => setShowPaymentModal(true)} className="w-full h-16 text-xs font-black  tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-100">Unlock Mastery Now</Button>
                       <button className="w-full h-16 text-xs font-black  tracking-[0.2em] rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all">Share Path</button>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-gray-400  tracking-widest text-center border-b border-gray-50 pb-4 mb-4">Enterprise Bundle available</p>
                       <ul className="space-y-4">
                          <Attribute icon={<Play size={14} />} label="Full Lifetime Access" />
                          <Attribute icon={<FileText size={14} />} label="24 Specialized Resources" />
                          <Attribute icon={<Award size={14} />} label="Official Certification" />
                       </ul>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Navigation Tabs */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-2xl border-b border-gray-100 z-50 py-4 mb-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-12">
            {['description', 'curriculum', 'instructor'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-black  tracking-[0.3em] py-2 transition-all border-b-2 relative ${
                  activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
          <div className="lg:col-span-2">
            
            {activeTab === 'description' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm mb-12">
                   <h3 className="text-3xl font-black text-gray-900  tracking-tighter mb-10 italic">Core Competencies</h3>
                   <div className="prose prose-lg prose-blue max-w-none font-medium leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <FeatureBox title="AI Integrated" desc="Our curriculum adapt with market trends automatically." icon={<Cpu size={20} />} />
                   <FeatureBox title="Skill Benchmarking" desc="Pre & post assessment for every major module." icon={<TrendingUp size={20} className="text-emerald-500" />} />
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-10 px-4">
                   <h3 className="text-xl font-black text-gray-900  tracking-tighter italic">Syllabus Architecture</h3>
                   <span className="text-[10px] font-black text-gray-400  tracking-widest">{course.sections.length} Modules Total</span>
                </div>
                {course.sections.map((section, sIdx) => (
                  <div key={section.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden transition-all group hover:border-blue-200 shadow-sm">
                    <button 
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-8 hover:bg-gray-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedSections.includes(section.id) ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                          <span className="text-[10px] font-black ">{sIdx + 1 < 10 ? `0${sIdx+1}` : sIdx+1}</span>
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 leading-none mb-2  tracking-tighter text-sm">{section.title}</h4>
                          <span className="text-[10px] font-black text-gray-400  tracking-[0.2em]">{section.lessons.length} Drill Points</span>
                        </div>
                      </div>
                      <ChevronDown size={20} className={`text-gray-300 transition-transform duration-500 ${expandedSections.includes(section.id) ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>
                    
                    {expandedSections.includes(section.id) && (
                      <div className="px-8 pb-8 pt-0 animate-in slide-in-from-top-4 duration-500">
                        <div className="space-y-3 pt-6 border-t border-gray-50">
                          {section.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between p-5 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-blue-50 transition-all group/item cursor-default">
                              <div className="flex items-center gap-4">
                                {lesson.content_type === 'video' ? <PlayCircle size={16} className="text-blue-500" /> : 
                                 lesson.content_type === 'quiz' ? <HelpCircle size={16} className="text-emerald-500" /> : 
                                 <FileText size={16} className="text-purple-500" />}
                                <span className="text-[11px] font-black  tracking-tight text-gray-600 group-hover/item:text-gray-900 transition-colors">{lesson.title}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className="text-[9px] font-bold text-gray-300  tracking-widest">12:45</span>
                                 <button className="text-[9px] font-black text-blue-600  tracking-widest opacity-0 group-hover/item:opacity-100 transition-all flex items-center gap-1">Details <ArrowRight size={10} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'instructor' && (
              <div className="bg-white p-16 rounded-[3.5rem] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row gap-12 items-start mb-16">
                  <div className="w-48 h-48 flex-shrink-0 relative">
                    <img src={course.author.picture} className="w-full h-full object-cover rounded-[2.5rem] shadow-2xl border-4 border-white" alt="" />
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200">
                      <CheckCircle size={24} />
                    </div>
                  </div>
                  <div className="pt-4">
                    <h4 className="text-4xl font-black text-gray-900 mb-2  tracking-tighter italic">{course.author.fullname}</h4>
                    <p className="text-blue-600 font-black mb-6 text-[10px]  tracking-[0.3em]">{course.author.short_description}</p>
                    <div className="prose prose-blue text-gray-500 font-medium leading-relaxed italic" dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.author.long_description) }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-12 border-t border-gray-50">
                   <InstructorMetric label="Avg Rating" value="4.8" icon={<Star size={14} className="text-yellow-500" />} />
                   <InstructorMetric label="Enrollments" value="15.2k" icon={<Users size={14} className="text-blue-500" />} />
                   <InstructorMetric label="Drill Modules" value="24" icon={<Target size={14} className="text-purple-500" />} />
                   <InstructorMetric label="Reviews" value="1.4k" icon={<FileText size={14} className="text-emerald-500" />} />
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block space-y-12">
            <div className="bg-[#0F172A] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <span className="text-[9px] font-black text-blue-400  tracking-[0.4em] mb-4 block">Beta Offer</span>
                  <h4 className="text-3xl font-black mb-6 tracking-tighter  italic leading-none">Global <br /> Access.</h4>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">Join our strategic workforce program and get unlimited access to 2,000+ paths.</p>
                  <button className="w-full h-14 bg-white text-blue-900 font-black rounded-2xl shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all text-[10px]  tracking-widest">Get Unlimited Pro</button>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Activity size={120} />
                </div>
            </div>
          </div>
        </div>
      </div>
      
      {showPaymentModal && (
        <PaymentModal 
          courseId={course.id}
          courseTitle={course.course_title}
          price={4999} 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            router.push(`/student`);
          }}
        />
      )}
    </main>
  );
};

function Attribute({ icon, label }: any) {
   return (
      <li className="flex items-center gap-3 text-gray-500">
         <div className="text-blue-600">{icon}</div>
         <span className="text-[10px] font-black  tracking-widest">{label}</span>
      </li>
   );
}

function FeatureBox({ title, desc, icon }: any) {
   return (
      <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
         <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
            {icon}
         </div>
         <h5 className="font-black text-gray-900  tracking-tight mb-2 text-sm">{title}</h5>
         <p className="text-[10px] font-bold text-gray-400  tracking-widest">{desc}</p>
      </div>
   );
}

function InstructorMetric({ label, value, icon }: any) {
   return (
      <div className="text-center group">
         <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-black text-gray-900 tracking-tighter italic">{value}</span>
            {icon}
         </div>
         <div className="text-[9px] text-gray-400 font-black  tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">{label}</div>
      </div>
   );
}

function Loader() {
   return (
      <div className="flex gap-2">
         <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
         <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
         <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
      </div>
   );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

export default CourseDetailPage;
