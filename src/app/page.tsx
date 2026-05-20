'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  BookOpen, Globe, Brain, Cpu, Activity, Users,
  TrendingUp, Zap, Shield, Award, ChevronRight,
  Play, Star, Menu, X, Flame
} from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import BrandLogo from '@/components/BrandLogo';

const mockCourses = [
  {
    id: 1, slug: 'digital-marketing-mastery',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
    course_title: 'Digital Marketing Mastery 2024: From Zero to Hero',
    view: 1240, author: { fullname: 'Sarah Johnson', picture: '' },
    userHasLiked: false, userHasDisliked: false, hasBookmarked: false,
    is_unlocked: true, is_private: false, isPaid: true, formattedPrice: '49.99', level: 'Expert'
  },
  {
    id: 2, slug: 'creative-graphic-design',
    thumbnail: 'https://images.unsplash.com/photo-1572044162444-ad60f128bde3?q=80&w=800&auto=format&fit=crop',
    course_title: 'UI/UX Design Fundamentals: Building Modern Apps',
    view: 850, author: { fullname: 'Michael Chen', picture: '' },
    userHasLiked: true, userHasDisliked: false, hasBookmarked: true,
    is_unlocked: true, is_private: false, isPaid: false, formattedPrice: '0.00', level: 'Beginner'
  },
  {
    id: 3, slug: 'advanced-web-development',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
    course_title: 'Advanced Full-Stack Web Development: The Complete Guide',
    view: 2100, author: { fullname: 'Alex Rivera', picture: '' },
    userHasLiked: false, userHasDisliked: false, hasBookmarked: false,
    is_unlocked: true, is_private: false, isPaid: true, formattedPrice: '99.00', level: 'Intermediate'
  }
];

const partners = [
  { src: '/images/partners/fresh-m-radio-logo.svg', alt: 'Fresh M Radio' },
  { src: '/images/partners/ajira.png', alt: 'Ajira' },
  { src: '/images/partners/iyef.png', alt: 'IYEF' },
  { src: '/images/partners/kepsa.png', alt: 'KEPSA' },
  { src: '/images/partners/mastercard-foundations.png', alt: 'Mastercard Foundation' },
];

const launchpadFeatures = [
  'Job board & internship matching',
  'Mentor connect & 1-on-1 sessions',
  'Startup incubation resources',
  'Career pathway mapping',
];

const platformFeatures = [
  { icon: <BookOpen size={18} />, title: 'Expert courses', desc: 'Curated curriculum from vetted professionals.' },
  { icon: <Brain size={18} />, title: 'Ai assistance', desc: 'Ai-powered summaries and adaptive learning paths.' },
  { icon: <Users size={18} />, title: 'Cohort groups', desc: 'Learn collaboratively in structured cohorts.' },
  { icon: <Award size={18} />, title: 'Certifications', desc: 'Industry-recognised certificates on completion.' },
  { icon: <Activity size={18} />, title: 'Live analytics', desc: 'Real-time tracking of your progress and milestones.' },
  { icon: <Globe size={18} />, title: 'Global access', desc: 'Courses available in multiple languages.' },
  { icon: <Cpu size={18} />, title: 'Video conferencing', desc: 'Built-in live class sessions with instructors.' },
  { icon: <TrendingUp size={18} />, title: 'Monetization', desc: 'Publish your courses and earn from your expertise.' },
];

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    (async () => {
      try {
        const [courseRes, userRes] = await Promise.allSettled([
          api.get('/courses/popular'),
          api.get('/me')
        ]);
        if (courseRes.status === 'fulfilled' && courseRes.value.data?.length > 0) {
          setCourses(courseRes.value.data);
        }
        
        if (userRes.status === 'fulfilled') {
          setUser(userRes.value.data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    })();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 py-2 shadow-sm' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <BrandLogo variant="dark" className="flex-shrink-0" />

          <div className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">Marketplace</Link>
            <a href="#courses" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">Courses</a>
            <a href="#partners" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">Partners</a>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {!user ? (
              <div className="flex items-center gap-3">
                <Link href="/register?type=instructor">
                  <button className="h-9 px-5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all">Teach on Visiondrill</button>
                </Link>
                <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors mx-2">Login</Link>
                <Link href="/register">
                  <button className="h-9 px-5 border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all">Join us</button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href={user.roles?.some((r: any) => r.name === 'author') ? '/instructor' : '/student'}>
                  <button className="h-9 px-5 border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all">Dashboard</button>
                </Link>
                <Link href="/logout">
                  <button className="h-9 px-5 bg-red-50 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-100 transition-all">Logout</button>
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg px-4 py-4 space-y-1">
            <Link href="/courses" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-600 hover:text-blue-600 py-2.5">Marketplace</Link>
            <a href="#courses" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-600 hover:text-blue-600 py-2.5">Courses</a>
            <a href="#partners" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-gray-600 hover:text-blue-600 py-2.5">Partners</a>
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
              {!user ? (
                <>
                  <Link href="/register?type=instructor" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full h-10 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700">Teach on Visiondrill</button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full h-10 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:border-blue-300">Login</button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full h-10 border border-gray-100 rounded-xl font-semibold text-sm text-gray-400 hover:bg-gray-50">Join us</button>
                  </Link>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href={user.roles?.some((r: any) => r.name === 'author') ? '/instructor' : '/student'} onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full h-10 bg-blue-600 text-white rounded-xl font-semibold text-sm">Dashboard</button>
                  </Link>
                  <Link href="/logout" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full h-10 border border-red-100 text-red-600 rounded-xl font-semibold text-sm">Logout</button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.05),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Hero copy */}
          <div className="order-1">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-600">
                <Activity size={10} /> 15,000+ active learners
              </div>
              <span className="text-xs font-medium text-gray-400">· Global platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 leading-[0.92] tracking-tighter mb-6">
              Learn from<br />
              <span className="text-blue-600">experts</span><br />
              through tailored<br />
              pathways.
            </h1>

            <p className="text-gray-400 font-medium text-sm sm:text-base leading-relaxed mb-8 max-w-md">
              Trusted by 15,000 learners worldwide. Visiondrill provides marketable, industry-applicable online courses for all levels.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/register">
                <button className="h-11 px-7 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                  <Play size={14} /> Start learning
                </button>
              </Link>
              <Link href="/courses">
                <button className="h-11 px-7 bg-gray-50 border border-gray-200 text-gray-600 font-semibold text-sm rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2">
                  Browse courses <ChevronRight size={14} />
                </button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-gray-100">
              {[
                { icon: <Shield size={14} />, label: 'Certification provided' },
                { icon: <Globe size={14} />, label: 'Global access' },
                { icon: <Brain size={14} />, label: 'Ai-powered learning' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400">
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Launchpad promo card (desktop) */}
          <div className="order-2 hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-blue-100 shadow-2xl shadow-blue-100/40 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 flex flex-col gap-7">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/30 flex-shrink-0">
                  <img src="/images/visiondrill-logo-icon.png" alt="Launchpad" className="w-9 h-9 object-contain" />
                </div>
                <div>
                  <p className="text-white/50 font-medium text-xs mb-0.5">Powered by Visiondrill</p>
                  <h2 className="text-white font-black text-2xl tracking-tight leading-none">Launchpad</h2>
                </div>
              </div>

              <div className="relative">
                <p className="text-white font-bold text-xl leading-snug">
                  Your career rocket.<br />
                  <span className="text-blue-200">Built. Launched. Scaled.</span>
                </p>
                <p className="text-white/50 font-medium text-sm leading-relaxed mt-3">
                  Visiondrill Launchpad connects learners with real job opportunities, mentors, and startup resources — all in one place.
                </p>
              </div>

              <ul className="relative space-y-2.5">
                {launchpadFeatures.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="relative">
                <a href="https://launchpad.visiondrill.com" target="_blank" rel="noopener noreferrer">
                  <button className="w-full h-11 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 active:scale-95">
                    <Zap size={14} className="text-blue-600" />
                    Visit Launchpad
                    <ChevronRight size={14} />
                  </button>
                </a>
                <p className="text-center text-white/30 text-xs font-medium mt-2.5">
                  Free to join · No credit card required
                </p>
              </div>
            </div>
          </div>

          {/* Launchpad card — mobile compact */}
          <div className="order-3 lg:hidden">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 p-6 flex flex-col gap-4 border border-blue-100 shadow-xl shadow-blue-100/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <img src="/images/visiondrill-logo-icon.png" alt="Launchpad" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <p className="text-white/50 font-medium text-xs">Powered by Visiondrill</p>
                  <h2 className="text-white font-black text-lg leading-none">Launchpad</h2>
                </div>
              </div>
              <p className="text-white/60 font-medium text-sm leading-relaxed">
                Connect with jobs, mentors & startup resources — all in one place.
              </p>
              <a href="https://launchpad.visiondrill.com" target="_blank" rel="noopener noreferrer">
                <button className="w-full h-10 bg-white text-blue-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Zap size={13} className="text-blue-600" /> Visit Launchpad <ChevronRight size={13} />
                </button>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── Popular course scroll ── */}
      <section className="py-12 bg-[#FDFDFF] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#007AB0] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <Flame size={20} fill="currentColor" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Featured courses</h2>
            </div>
            <Link href="/courses" className="text-sm font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
              Explore all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="relative group">
            <div className="flex gap-6 overflow-x-auto pb-10 no-scrollbar scroll-smooth">
                {(courses.length > 0 ? courses : mockCourses).map(course => (
                  <div key={course.id} className="w-[300px] sm:w-[380px] shrink-0">
                    <CourseCard course={course} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending courses (Grid) ── */}
      <section id="courses" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8 sm:mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#007AB0] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <TrendingUp size={20} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Trending courses</h2>
              </div>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors flex-shrink-0">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {(courses.length > 0 ? courses : mockCourses).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform features ── */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={13} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-600">Platform features</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">
                Everything you need<br /><span className="text-gray-300">to learn & grow.</span>
              </h2>
            </div>
          </div>

          <div className="relative">
            <div
              className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 no-scrollbar"
            >
              {platformFeatures.map((feat, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 p-5 sm:p-6 bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group cursor-default rounded-xl"
                  style={{ minWidth: '200px' }}
                >
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-5 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all">
                    {feat.icon}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{feat.title}</h3>
                  <p className="text-xs font-medium text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners (Moved down before footer) ── */}
      <section id="partners" className="py-16 sm:py-20 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-black text-gray-400 mb-12 tracking-[0.3em]">Our premium partners & sponsors</p>
          <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-16 md:gap-24">
            {partners.map((p, i) => (
              <img key={i} src={p.src} alt={p.alt} className="h-8 sm:h-10 object-contain hover:scale-110 transition-all duration-500" />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-14">
            <div className="col-span-2 lg:col-span-1">
              <BrandLogo variant="light" className="mb-5" />
              <p className="text-xs font-medium text-white/30 leading-relaxed mb-6 max-w-xs">
                Engineering the next generation of professional excellence through tailored expert pathways.
              </p>
              <div className="flex gap-3">
                {[Globe, Activity, Brain].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/20 transition-all cursor-pointer">
                    <Icon size={14} />
                  </div>
                ))}
              </div>
            </div>
            {[
              { title: 'Company', links: [{ name: 'About', path: '/about' }, { name: 'Careers', path: '/careers' }, { name: 'Contact', path: '/contact' }] },
              { title: 'Explore', links: [{ name: 'All courses', path: '/courses' }, { name: 'Certifications', path: '#' }, { name: 'Instructors', path: '#' }] },
              { title: 'Legal', links: [{ name: 'Privacy policy', path: '/privacy' }, { name: 'Terms of service', path: '/terms' }, { name: 'Security', path: '/security' }] },
            ].map((col, i) => (
              <div key={i}>
                <h5 className="font-bold text-xs text-white/30 mb-4">{col.title}</h5>
                <ul className="space-y-2.5">
                  {col.links.map((item, j) => (
                    <li key={j}>
                      <Link href={item.path} className="text-white/40 hover:text-white transition-colors text-sm font-medium">{item.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-6 border-t border-white/5">
            <p className="text-xs font-medium text-white/20">© 2026 Visiondrill. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs font-medium text-white/20">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> System online
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
