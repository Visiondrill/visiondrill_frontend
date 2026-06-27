'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Save, Loader2, FileText, CheckCircle, AlertCircle, X, Paperclip, Eye, Upload } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

interface TextEditorProps {
  lessonId: number;
  courseId: number;
  initialBody?: string;
  initialDocumentUrl?: string | null;
  initialImageUrl?: string | null;
  onClose?: () => void;
  onSaved?: () => void;
}

const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'txt'];
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const STORAGE_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || '';

export default function TextEditor({ lessonId, courseId, initialBody = '', initialDocumentUrl = null, initialImageUrl = null, onClose, onSaved }: TextEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(initialDocumentUrl);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_IMAGE_TYPES.includes(ext)) {
        setValidationError(`Invalid image type ".${ext}". Allowed: JPG, PNG, GIF, WEBP.`);
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(`Image size exceeds ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      setImageFile(selectedFile);
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

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setValidationError(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSave = async () => {
    const isUploadingFiles = file !== null || imageFile !== null;
    setStatus(isUploadingFiles ? 'uploading' : 'saving');
    setStatusMessage(isUploadingFiles ? 'Uploading assets...' : 'Saving text material...');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('body', body);
    if (file) {
      formData.append('document_file', file);
    }
    if (imageFile) {
      formData.append('image_file', imageFile);
    }

    try {
      const response = await api.post(
        `/instructor/courses/${courseId}/curriculum/lectures/${lessonId}/text`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          },
        }
      );

      if (response.data?.data?.document_url) {
        setDocumentUrl(response.data.data.document_url);
      }
      if (response.data?.data?.image_url) {
        setImageUrl(response.data.data.image_url);
      }
      setStatus('done');
      setStatusMessage('Text material saved successfully!');
      setFile(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
      onSaved?.();
    } catch (err: any) {
      // Handle validation errors from backend (e.g. invalid file type, size)
      if (err.response?.status === 422) {
        setValidationError(err.response?.data?.message || 'File validation failed.');
        setStatus('error');
        setStatusMessage('Upload rejected — validation failed');
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

        {/* Upload progress bar */}
        {status === 'uploading' && (
          <div className="mb-6 p-6 bg-blue-50/50 border border-blue-50 rounded-3xl flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <Loader2 className="text-blue-600 animate-spin relative" size={36} />
            </div>
            <p className="text-blue-900 font-black text-sm tracking-widest mb-2">{statusMessage}</p>
            <p className="text-blue-600/60 text-xs font-medium mb-6 italic">Please keep this window open while your file uploads.</p>
            <div className="w-full max-w-md bg-blue-100 rounded-full h-2 shadow-inner">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-blue-500/70 tracking-wider mt-3">{uploadProgress}% complete</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Upload */}
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
            {file && status !== 'uploading' && (
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

            {!file && !documentUrl && status !== 'uploading' && (
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

          {/* Image Upload */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase">Attach Image (Optional)</label>

            {/* Existing image preview */}
            {!imageFile && imageUrl && (
              <div className="aspect-video relative rounded-3xl overflow-hidden border border-gray-100 group">
                <img
                  src={`${STORAGE_ROOT}/uploads/lessons/images/${imageUrl}`}
                  alt="Lesson preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">Current Image</p>
                </div>
              </div>
            )}

            {/* New image selected */}
            {imageFile && status !== 'uploading' && (
              <div className="aspect-video relative rounded-3xl overflow-hidden border border-purple-200 group">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {!imageFile && !imageUrl && status !== 'uploading' && (
              <div
                className="flex-grow border-2 border-dashed border-gray-100 rounded-3xl p-10 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/20 transition-all group"
                onClick={() => imageInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Upload className="text-gray-400 group-hover:text-emerald-600" size={20} />
                </div>
                <p className="font-black text-gray-400 text-sm">Click to upload image</p>
                <p className="text-[10px] font-medium text-gray-300">JPG, PNG, WEBP up to 20MB</p>
              </div>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={status === 'saving' || status === 'uploading'}
          className="w-full h-16 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {status === 'saving' || status === 'uploading' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {status === 'uploading' ? 'Uploading Assets…' : status === 'saving' ? 'Saving…' : 'Save Lesson'}
        </button>
      </div>
    </div>
  );
}