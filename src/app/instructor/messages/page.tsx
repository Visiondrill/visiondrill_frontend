'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { 
  Send, 
  Search, 
  MessageSquare, 
  User, 
  Clock, 
  ChevronRight,
  Loader2,
  Paperclip,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstructorMessagingPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isMobileThreadView, setIsMobileThreadView] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchThreads = async () => {
    try {
      const res = await api.get('/student/messages/threads');
      const data = Array.isArray(res.data) ? res.data : [];
      setThreads(data);
      if (data.length > 0 && !activeThread) {
        handleSelectThread(data[0]);
      }
    } catch (err) {
      console.error(err);
      setThreads([]);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const handleSelectThread = async (thread: any) => {
    setActiveThread(thread);
    setIsMobileThreadView(false);
    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/student/messages/threads/${thread.id}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Could not retrieve conversation history.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeThread) return;

    const content = reply;
    setReply('');

    try {
      const res = await api.post(`/student/messages/threads/${activeThread.id}/reply`, {
        body: content
      });
      setMessages([...messages, res.data]);
    } catch (err) {
      toast.error('Delivery failed.');
      setReply(content);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoadingThreads) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="text-blue-600 animate-spin" size={32} />
      <p className="text-sm font-bold text-gray-400 tracking-widest">Opening secure channel...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-0 md:gap-8">
      {/* 1. Left Sidebar: Threads List */}
      <aside className={`
        w-full md:w-80 xl:w-96 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm
        ${!isMobileThreadView ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-8 border-b border-gray-50">
           <h2 className="text-xl font-black text-gray-900 mb-6">Messaging hub</h2>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                placeholder="Find student conversations..." 
                className="w-full bg-gray-50 border border-transparent rounded-2xl pl-12 pr-4 py-3 text-xs font-semibold focus:bg-white focus:border-blue-100 outline-none transition-all"
              />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {threads && Array.isArray(threads) && threads.map((thread) => (
             <div 
               key={thread.id} 
               onClick={() => handleSelectThread(thread)}
               className={`p-6 cursor-pointer border-b border-gray-50 transition-all ${
                 activeThread?.id === thread.id ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'
               }`}
             >
                <div className="flex justify-between items-start mb-2 gap-4">
                   <div className="font-black text-gray-900 text-sm leading-tight truncate">
                      {thread.student?.name || 'General Inquiry'}
                   </div>
                   <span className="text-[10px] font-sans text-gray-400 shrink-0">
                      {thread.last_message ? new Date(thread.last_message.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                   </span>
                </div>
                <p className="text-xs font-medium text-gray-400 line-clamp-2 leading-relaxed">
                   {thread.last_message?.body || 'No activity recorded yet.'}
                </p>
                <div className="mt-2 text-[10px] font-bold text-blue-600">
                   {thread.course_title}
                </div>
             </div>
           ))}
           {(!threads || threads.length === 0) && (
             <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
                  <MessageSquare size={32} />
                </div>
                <p className="text-xs font-bold text-gray-400 italic">Zero threads found.</p>
             </div>
           )}
        </div>
      </aside>

      {/* 2. Main Content: Conversation Window */}
      <main className={`
        flex-1 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm
        ${isMobileThreadView ? 'hidden md:flex' : 'flex'}
      `}>
         {activeThread ? (
           <>
              <header className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-3 md:gap-4">
                    <button 
                      onClick={() => setIsMobileThreadView(true)}
                      className="md:hidden p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-all"
                    >
                       <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0">
                       {activeThread.student?.name?.[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                       <h3 className="text-base md:text-lg font-black text-gray-900 leading-none truncate">{activeThread.student?.name}</h3>
                       <div className="flex items-center gap-2 mt-1.5 font-bold text-[10px] text-gray-400 tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="truncate">{activeThread.course_title}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-1 md:gap-3">
                    <button className="hidden sm:block p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Phone size={18} /></button>
                    <button className="hidden sm:block p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Video size={18} /></button>
                    <button className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"><MoreVertical size={18} /></button>
                 </div>
              </header>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar bg-gray-50/20">
                 {isLoadingMessages ? (
                   <div className="flex justify-center py-20">
                      <Loader2 className="text-blue-100 animate-spin" size={48} />
                   </div>
                 ) : (
                   messages.map((msg, i) => (
                     <div key={i} className={`flex ${msg.sender_type === 'instructor' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-xl rounded-[2rem] md:rounded-[2.5rem] px-6 md:px-8 py-4 md:py-6 text-sm font-medium leading-relaxed ${
                          msg.sender_type === 'instructor' 
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                            : 'bg-white border border-gray-100 text-gray-700 shadow-sm'
                        }`}>
                           {msg.body}
                           <div className={`text-[10px] mt-4 font-sans ${msg.sender_type === 'instructor' ? 'text-blue-200' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('en-GB')}
                           </div>
                        </div>
                     </div>
                   ))
                 )}
                 <div ref={messagesEndRef} />
              </div>

              <footer className="p-6 md:p-8 border-t border-gray-50 bg-white">
                 <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                    <input 
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type response..." 
                      className="w-full bg-gray-50 border border-transparent rounded-[2rem] pl-6 md:pl-8 pr-28 md:pr-32 py-4 md:py-5 text-sm font-medium focus:bg-white focus:border-blue-100 outline-none transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2">
                       <button type="button" className="hidden sm:block p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                          <Paperclip size={20} />
                       </button>
                       <button 
                         type="submit"
                         className="bg-gray-900 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl hover:bg-blue-600 transition-all font-black text-[10px] tracking-widest shadow-lg active:scale-95"
                       >
                          Send
                       </button>
                    </div>
                 </form>
              </footer>
           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-12 md:p-20 text-center gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-200">
                 <MessageSquare size={32} />
              </div>
              <div className="max-w-xs">
                 <h4 className="text-xl md:text-2xl font-black text-gray-900 mb-2 leading-none">No conversation selected</h4>
                 <p className="text-sm font-medium text-gray-500 leading-relaxed">Select a student thread to begin support.</p>
              </div>
           </div>
         )}
      </main>
    </div>
  );
}
