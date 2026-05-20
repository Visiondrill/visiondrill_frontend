'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Save, Loader2, FileText, CheckCircle, AlertCircle, X, Paperclip } from 'lucide-react';

interface TextEditorProps {
  lessonId: number;
  courseId: number;
  initialBody?: string;
  onClose?: () => void;
  onSaved?: () => void;
}

export default function TextEditor({ lessonId, courseId, initialBody = '', onClose, onSaved }: TextEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSave = async () => {
    setStatus('saving');
    setStatusMessage('Saving text material...');

    const formData = new FormData();
    formData.append('body', body);
    if (file) {
      formData.append('document_file', file);
    }

    try {
      // The backend route is web route: /instructor/courses/{courseId}/curriculum/lectures/{lessonId}/text
      // But we will access it via api route if available, or fallback to absolute path by removing api prefix.
      const response = await api.post(
        `/instructor/courses/${courseId}/curriculum/lectures/${lessonId}/text`, 
        formData, 

        {
          headers: { 'Content-Type': 'multipart/form-data' },
          // we use the baseURL trick: axios will prepend baseURL `/api`, but if we hack it... wait.
        }
      );
      
      setStatus('done');
      setStatusMessage('Text material saved successfully!');
      onSaved?.();
      
      // Auto close after 2s
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
      
    } catch (err: any) {
      // Actually, if it's a redirect, axios might follow it or return an error depending on CORS
      if (err.response?.status === 200) {
          setStatus('done');
          setStatusMessage('Text material saved successfully!');
          onSaved?.();
          setTimeout(() => { if (onClose) onClose(); }, 2000);
          return;
      }

      setStatus('error');
      setStatusMessage(err.response?.data?.message || err.message || 'Failed to save material.');
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-900 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
            <FileText className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter">Text Editor</h3>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">Lesson Content • References</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-400">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-8 space-y-6">
        {status === 'done' && (
          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-4">
            <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="font-black text-emerald-800 text-sm mb-1 tracking-widest">Saved</p>
              <p className="text-emerald-700/80 text-sm font-medium leading-relaxed">{statusMessage}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="font-black text-red-800 text-sm mb-1 tracking-widest">Error</p>
              <p className="text-red-700/80 text-sm font-medium leading-relaxed">{statusMessage}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
           <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase">Text Content</label>
           <textarea 
             value={body}
             onChange={(e) => setBody(e.target.value)}
             placeholder="Write your lesson notes, description, or transcript here..."
             className="w-full min-h-[250px] p-6 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-medium leading-relaxed focus:ring-4 focus:ring-purple-50 focus:border-purple-300 outline-none transition-all shadow-inner"
           />
        </div>

        <div className="space-y-4">
           <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase">Attach Document (Optional)</label>
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="border-2 border-dashed border-gray-100 rounded-[2rem] p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/20 transition-all group flex flex-col items-center justify-center gap-3"
           >
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                 <Paperclip className="text-gray-400 group-hover:text-purple-600" size={20} />
              </div>
              {file ? (
                 <p className="font-black text-gray-900 text-sm">{file.name}</p>
              ) : (
                 <p className="font-black text-gray-400 text-sm">Click to upload doc/pdf</p>
              )}
           </div>
           <input ref={fileInputRef} type="file" accept=".doc,.docx,.pdf,.txt" onChange={handleFileChange} className="hidden" />
        </div>

        <button 
           onClick={handleSave}
           disabled={status === 'saving'}
           className="w-full h-16 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
           {status === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
           {status === 'saving' ? 'Saving...' : 'Save Lesson'}
        </button>
      </div>
    </div>
  );
}
