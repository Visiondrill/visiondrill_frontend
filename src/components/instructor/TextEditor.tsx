'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Save, Loader2, FileText, CheckCircle, AlertCircle, X, Paperclip, Eye } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

interface TextEditorProps {
  lessonId: number;
  courseId: number;
  initialBody?: string;
  initialDocumentUrl?: string | null;
  onClose?: () => void;
  onSaved?: () => void;
}

const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'txt'];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const STORAGE_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || '';

export default function TextEditor({ lessonId, courseId, initialBody = '', initialDocumentUrl = null, onClose, onSaved }: TextEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [file, setFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(initialDocumentUrl);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      const error = validateFile(selectedFile);
      if (error) {
        setValidationError(error);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const validateFile = (selectedFile: File): string | null => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      return `Invalid file type ".${ext}". Allowed types: PDF, DOC, DOCX, TXT.`;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE_MB}MB limit.`;
    }
    return null;
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      const response = await api.post(
        `/instructor/courses/${courseId}/curriculum/lectures/${lessonId}/text`, 
        formData
      );
      
      if (response.data?.data?.document_url) {
        setDocumentUrl(response.data.data.document_url);
      }
      setStatus('done');
      setStatusMessage('Text material saved successfully!');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSaved?.();
      
    } catch (err: any) {
      if (err.response?.status === 200) {
          setStatus('done');
          setStatusMessage('Text material saved successfully!');
          onSaved?.();
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

        {validationError && (
          <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="font-black text-red-800 text-sm mb-1 tracking-widest">Validation Error</p>
              <p className="text-red-700/80 text-sm font-medium leading-relaxed">{validationError}</p>
            </div>
          </div>
        )}

        {status === 'error' && !validationError && (
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
           <RichTextEditor 
             content={body}
             onChange={setBody}
             placeholder="Write your lesson notes, description, or transcript here..."
             minHeight="300px"
           />
        </div>

        <div className="space-y-4">
           <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase">Attach Document (Optional)</label>
           
           {/* Existing document preview */}
           {!file && documentUrl && (
             <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-blue-900 line-clamp-1 max-w-[200px]">{documentUrl.split('/').pop()}</p>
                    <p className="text-[10px] font-bold text-blue-500/70 tracking-wider mt-0.5">Uploaded document</p>
                  </div>
                </div>
                <a 
                  href={`${STORAGE_ROOT}/uploads/lessons/documents/${documentUrl}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Eye size={14} /> Preview
                </a>
             </div>
           )}
           
           {/* New file selected */}
           {file && (
             <div className="flex items-center justify-between p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FileText className="text-purple-600" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-purple-900 line-clamp-1 max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] font-bold text-purple-500/70 tracking-wider mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={clearFile} className="text-purple-400 hover:text-red-500 transition-colors p-1">
                  <X size={16} />
                </button>
             </div>
           )}
           
           {!file && !documentUrl && (
             <div 
               className="flex-grow border-2 border-dashed border-gray-100 rounded-3xl p-10 cursor-pointer hover:border-purple-400 hover:bg-purple-50/20 transition-all group"
               onClick={() => fileInputRef.current?.click()}
               onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
               onDrop={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 if (e.dataTransfer.files?.[0]) {
                   const droppedFile = e.dataTransfer.files[0];
                   const error = validateFile(droppedFile);
                   if (error) {
                     setValidationError(error);
                   } else {
                     setFile(droppedFile);
                   }
                 }
               }}
             >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                   <Paperclip className="text-gray-400 group-hover:text-purple-600" size={20} />
                </div>
                <p className="font-black text-gray-400 text-sm">Click to upload doc/pdf</p>
                <p className="text-[10px] font-medium text-gray-300">PDF, DOC, DOCX, TXT up to 20MB</p>
             </div>
           )}
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