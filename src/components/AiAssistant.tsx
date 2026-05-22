'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2, X, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistant({ lessonId, videoUrl, lessonTitle }: { lessonId: number, videoUrl: string, lessonTitle: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      // We use the SSE endpoint. Auth is via Laravel Sanctum cookies, not a bearer token,
      // so we forward the session/XSRF cookies via `credentials: 'include'` and attach the
      // X-XSRF-TOKEN header read from the cookie (same flow as the api Axios instance).
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const xsrfCookie = typeof document !== 'undefined'
        ? (document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN=')) || '').split('=')[1]
        : '';
      const response = await fetch(`${baseUrl}/engine/api/stream/sse`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'X-Requested-With': 'XMLHttpRequest',
          ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie) } : {}),
        },
        body: JSON.stringify({
          message: userMsg,
          context: `The student is currently watching the lesson: "${lessonTitle}".`,
          model: 'deepseek',
          lesson_id: lessonId,
          video_url: videoUrl
        })
      });

      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                assistantContent += data.content;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = assistantContent;
                  return newMsgs;
                });
              } else if (data.error) {
                 assistantContent += `\n\nError: ${data.error}`;
                 setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = assistantContent;
                    return newMsgs;
                 });
              }
            } catch (e) {
              // Partial JSON or other data - ignore
            }
          }
        }
      }
    } catch (err) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isMinimized) {
     return (
        <button 
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 animate-bounce"
        >
           <Bot size={32} />
        </button>
     );
  }

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl flex flex-col h-[600px] shadow-2xl overflow-hidden relative group">
      
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
               <Sparkles size={20} />
            </div>
            <div>
               <h4 className="text-white font-black tracking-tight text-sm">VisionDrill AI Assistant</h4>
               <p className="text-[10px] text-blue-400 font-bold  tracking-widest">DeepSeek Engine Enabled</p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(true)} className="p-2 text-slate-500 hover:text-white transition-colors">
               <Minimize2 size={18} />
            </button>
         </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
         {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-10">
               <Bot size={48} className="text-blue-500/20" />
               <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  I'm your personal learning assistant. Ask me anything about the transcription, concepts, or clarify parts of this lesson!
               </p>
               <div className="grid grid-cols-1 gap-2 w-full pt-4">
                  {['Summarize this lesson', 'What are the key takeaways?', 'Explain the technical terms'].map(tag => (
                     <button 
                         key={tag}
                         onClick={() => { setInput(tag); }}
                         className="text-[10px] font-black text-slate-500 border border-white/10 rounded-xl py-2 hover:bg-white/5 hover:text-blue-400 transition-all  tracking-widest"
                     >
                        {tag}
                     </button>
                  ))}
               </div>
            </div>
         )}

         {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-blue-400'
               }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
               </div>
               <div className={`max-w-[85%] rounded-xl p-4 text-sm font-medium leading-relaxed ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800/50 text-slate-200 border border-white/5 rounded-tl-none'
               }`}>
                  {msg.content || (isTyping && i === messages.length - 1 && <Loader2 className="animate-spin" size={16} />)}
               </div>
            </div>
         ))}
      </div>

      {/* Input */}
      <div className="p-6 bg-slate-950/50 border-t border-white/10">
         <div className="relative">
            <input 
               type="text"
               placeholder="Type your question..."
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-6 pr-14 py-4 text-white font-bold placeholder-slate-600 outline-none focus:border-blue-500 transition-all"
            />
            <button 
               onClick={handleSend}
               disabled={isTyping}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50"
            >
               <Send size={18} />
            </button>
         </div>
      </div>

    </div>
  );
}
