'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Trophy, 
  Settings, 
  LogOut, 
  MessageSquare,
  Users,
  Search,
  Bookmark,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.get('/me').then(res => setUser(res.data)).catch(() => {});
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/student' },
    { name: 'Inbox', icon: MessageSquare, href: '/student/messaging' },
    { name: 'Lesson', icon: BookOpen, href: '/student/courses' },
    { name: 'Analytics', icon: BarChart3, href: '/student/analytics' },
    { name: 'Group', icon: Users, href: '/student/cohorts' },
  ];

  return (
    <div className="h-screen bg-[#FDFDFF] flex overflow-hidden">
      {/* 1. Left Sidebar (Template Pattern) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-gray-100 flex-col shrink-0 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <div className="p-8 pb-12">
          <BrandLogo subtitle="Student" />
        </div>

        <nav className="flex-1 px-6 space-y-2">
          <p className="px-4 py-3 text-[10px] font-black text-gray-400  tracking-[0.2em]">Overview</p>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm
                ${pathname === item.href 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
              `}>
                <item.icon size={20} />
                <span>{item.name}</span>
              </div>
            </Link>
          ))}

          <div className="pt-10">
            <p className="px-4 py-3 text-[10px] font-black text-gray-400  tracking-[0.2em]">Settings</p>
            <Link href="/student/settings">
              <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-bold text-sm transition-all">
                <Settings size={20} />
                <span>Settings</span>
              </div>
            </Link>
            <Link href="/logout">
              <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm transition-all mt-1">
                <LogOut size={20} />
                <span>Logout</span>
              </div>
            </Link>
          </div>
        </nav>

        <div className="p-8 mt-auto">
          <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-50">
             <p className="text-[10px] font-black text-blue-600  tracking-widest mb-2">Upgrade pro</p>
             <p className="text-xs font-medium text-gray-500 leading-relaxed mb-4">Unlock advanced AI tools and live cohorts.</p>
             <button className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-100">Upgrade</button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content & Right Sidebar Container */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#FDFDFF] overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative z-50">
          <BrandLogo subtitle="Student" iconSize="sm" />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-50 rounded-xl text-gray-900">
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-white pt-24 px-6 space-y-4 animate-in slide-in-from-right">
             {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl text-lg font-black text-gray-900">
                     <item.icon size={24} /> {item.name}
                  </div>
                </Link>
             ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
           <div className="p-6 lg:p-10">
             {children}
           </div>
        </div>
      </section>
    </div>
  );
}
