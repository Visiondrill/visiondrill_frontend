'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus,
  MessageSquare,
  Wallet,
  Cpu,
  Sparkles
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
    { name: 'My courses', href: '/instructor/courses', icon: BookOpen },
    { name: 'Create quiz', href: '/instructor/quizzes/create', icon: Sparkles },
    { name: 'Student assets', href: '/instructor/students', icon: Users },

    { name: 'Analytics', href: '/instructor/analytics', icon: BarChart3 },
    { name: 'Inbox', href: '/instructor/messages', icon: MessageSquare },
  ];

  const utilityItems = [
    { name: 'Ai generator', href: '/instructor/ai-generator', icon: Cpu },
    { name: 'Revenue', href: '/instructor/revenue', icon: Wallet },
    { name: 'Settings', href: '/instructor/settings', icon: Settings },
  ];

  return (
    <div className="h-screen bg-[#FDFDFF] flex overflow-hidden">
      {/* 1. Left Sidebar (Fleet Management) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-gray-100 flex-col shrink-0 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <div className="p-8 pb-12">
          <BrandLogo subtitle="Instructor" />
        </div>

        <nav className="flex-1 px-6 space-y-2">
          <p className="px-4 py-3 text-[10px] font-black text-gray-400 tracking-[0.2em]">Command</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-10">
            <p className="px-4 py-3 text-[10px] font-black text-gray-400 tracking-[0.2em]">Intelligence</p>
            {utilityItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}
                  `}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              );
            })}
            
            <Link
              href="/logout"
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-1"
            >
              <LogOut size={18} />
              Logout session
            </Link>
          </div>
        </nav>
      </aside>

      {/* 2. Primary Executive Pane */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#FDFDFF] overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center justify-between p-6 bg-white border-b border-gray-100 shrink-0">
           <BrandLogo subtitle="Instructor" />
           <button className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Plus size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
           <div className="p-6 lg:p-10">
             {children}
           </div>
        </div>
      </section>
    </div>
  );
}
