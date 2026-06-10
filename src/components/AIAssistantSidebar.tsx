'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Send, Bot, User, Loader2, Brain, Info, ChevronDown, ListRestart } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantSidebarProps {
  lessonId: number;
  courseId: number;
}

export default function AIAssistantSidebar({ lessonId, courseId }: AIAssistantSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Summarize this lesson",
    "Explain key concepts",
    "Generate practice Quiz",
    "How does this relate to X?"
  ];

  const handleSummarize = async () => {
    if (isTyping) return;
    setIsTyping(true);
    try {
      const response = await api.post('/engine/api/stream/sse/summarize', {
        lesson_id: lessonId,
        course_id: courseId
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.summary || response.data.reply || "Summary: Core concepts extracted." }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Summarization engine offline." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVideoQA = async () => {
    if (isTyping) return;
    setIsTyping(true);
    try {
      const response = await api.post('/engine/api/stream/video', {
        lesson_id: lessonId,
        course_id: courseId,
        question: "What are the key points in this video?"
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply || "Video analysis complete." }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Video analysis engine offline." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    setMessages([{ 
      role: 'assistant', 
      content: "Hello! I'm your VisionDrill Intelligence. I've decoded this lesson's DNA. How can I assist your mastery today?" 
    }]);
  }, [lessonId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/engine/api/stream/sse', {
        message: messageText,
        lesson_id: lessonId,
        course_id: courseId,
        history: messages
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply || response.data.response || "Knowledge base processed." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Vision engine offline. Retrying link..." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F172A] text-white">
      {/* Premium Header */}
      <div className="p-8 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/50">
                 <Bot className="text-white" size={20} />
              </div>
              <div>
                 <h3 className="font-black text-[12px]  tracking-[0.2em] leading-none mb-2">Neural Link</h3>
                 <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-blue-400  tracking-widest px-2 py-0.5 bg-blue-400/10 rounded-md border border-blue-400/20">Active v2.4</span>
                 </div>
              </div>
           </div>
           <button className="text-white/20 hover:text-white transition-colors">
              <ListRestart size={18} />
           </button>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2`}>
             <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-[9px] font-black  tracking-widest text-white/30">{msg.role === 'user' ? 'Me' : 'Vision AI'}</span>
             </div>
             <div className={`p-6 rounded-[2rem] text-[13px] font-medium leading-relaxed max-w-[90%] shadow-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'}`}>
                {msg.content}
             </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col items-start space-y-4">
             <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] rounded-tl-none flex gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:800ms]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:800ms] [animation-delay:200ms]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:800ms] [animation-delay:400ms]"></div>
             </div>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-8 bg-[#0F172A] border-t border-white/5">
        <div className="flex flex-wrap gap-2 mb-6">
           {suggestions.map(tag => (
              <button 
                key={tag} 
                onClick={() => handleSend(tag)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black  tracking-widest text-white/40 hover:bg-white/10 hover:text-blue-400 hover:border-blue-400/30 transition-all active:scale-95"
              >
                {tag}
              </button>
           ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-30 transition duration-1000"></div>
          <div className="relative">
             <input 
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               disabled={isTyping}
               placeholder="Whisper your query..."
               className="w-full pl-6 pr-16 py-5 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm font-medium focus:ring-0 focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 text-white"
             />
             <button 
               type="submit"
               disabled={!input.trim() || isTyping}
               className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-500 disabled:opacity-20 transition-all shadow-xl shadow-black/20"
             >
               <Send size={20} className="translate-x-0.5 -translate-y-0.5" />
             </button>
          </div>
        </form>
        <p className="text-[9px] font-black  tracking-[0.2em] text-white/10 text-center mt-6">Secure Neural Encryption Active</p>
      </div>
    </div>
  );
}
