'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Upload, Loader2, CheckCircle, AlertCircle, Brain, Video, X, Edit3, Save, Sparkles, Eye, Play } from 'lucide-react';

interface VideoUploaderProps {
  lessonId: number;
  courseId: number;
  initialVideoUrl?: string | null;
  onTranscribed?: (videoUrl: string) => void;
  onClose?: () => void;
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/webm', 'video/ogg', 'video/avi', 'video/mpeg', 'video/quicktime'];
const MAX_VIDEO_SIZE_MB = 500;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const STORAGE_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || '';

export default function VideoUploader({ lessonId, courseId, initialVideoUrl = null, onTranscribed, onClose }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [finalVideoUrl, setFinalVideoUrl] = useState(initialVideoUrl || '');
  const [transcription, setTranscription] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if video/transcription already exists
    const checkExisting = async () => {
      try {
        const response = await api.get(`/ai/video-transcription/check?lesson_id=${lessonId}`);
        if (response.data.success && response.data.transcription) {
          setTranscription(response.data.transcription.transcription || '');
          if (response.data.transcription.video_url) {
            setFinalVideoUrl(response.data.transcription.video_url);
          }
          setStatus('done');
          setStatusMessage('Transcription found in system!');
        }
      } catch (err) {
        // Silently ignore check errors
      }
    };

    // If we already have a video URL passed in, show as done
    if (initialVideoUrl) {
      setFinalVideoUrl(initialVideoUrl);
    }

    checkExisting();
  }, [lessonId, initialVideoUrl]);

  const validateFile = (selectedFile: File): string | null => {
    if (!ALLOWED_VIDEO_TYPES.includes(selectedFile.type)) {
      return `Invalid file type "${selectedFile.type || 'unknown'}". Please upload a video file (MP4, MOV, WEBM).`;
    }
    if (selectedFile.size > MAX_VIDEO_SIZE_BYTES) {
      return `File size (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB) is very large. Consider compressing before upload.`;
    }
    // Mobile bandwidth check
    const MAX_MOBILE_FILE_MB = 50;
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (isMobile && (selectedFile.size / 1024 / 1024) > MAX_MOBILE_FILE_MB) {
      return `Mobile bandwidth limit: File exceeds ${MAX_MOBILE_FILE_MB}MB. Please compress your video or use a desktop/Wi-Fi connection.`;
    }
    return null;
  };

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
      // Start upload automatically
      handleSubmit(undefined, selectedFile);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getVideoPreviewUrl = (videoUrl: string): string => {
    if (videoUrl.startsWith('http') || videoUrl.startsWith('blob:')) return videoUrl;
    return `${STORAGE_ROOT}/uploads/videos/${videoUrl}`;
  };

  const requestTranscription = async (videoUrl: string) => {
    setStatus('transcribing');
    setStatusMessage('AI is analysing your video and generating a transcription…');

    const response = await api.post('/ai/video-transcription', {
      video_url: videoUrl,
      lesson_id: lessonId,
    });

    if (response.data.success) {
      setFinalVideoUrl(videoUrl);
      setTranscription(response.data.transcription_text || '');
      setStatus('done');
      setStatusMessage(response.data.from_cache ? 'Transcription found in cache!' : 'Transcription complete!');
      onTranscribed?.(videoUrl);
    } else {
      throw new Error(response.data.error || 'Transcription failed');
    }
  };

  const handleUpdateTranscript = async () => {
    setIsSavingTranscript(true);
    try {
      await api.post('/ai/video-transcription/update', {
        lesson_id: lessonId,
        transcription: transcription
      });
      setIsEditingTranscript(false);
    } catch (err) {
      alert("Failed to save transcript update.");
    } finally {
      setIsSavingTranscript(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overrideFile?: File) => {
    e?.preventDefault();
    setStatus('uploading');
    setStatusMessage('');
    setValidationError(null);

    try {
      if (!file && !overrideFile) throw new Error('Please select a file');
      
      setStatusMessage('Uploading video file…');
      const formData = new FormData();
      formData.append('file', overrideFile || file!);

      const uploadResponse = await api.post(`/upload/${lessonId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });
      
      const videoUrl = uploadResponse.data.video_url;
      await requestTranscription(videoUrl);
    } catch (err: any) {
      // Handle backend validation errors (e.g., video too long, low quality)
      if (err.response?.status === 422) {
        setValidationError(err.response?.data?.message || 'Video validation failed. Please check your file.');
        setStatus('error');
        setStatusMessage('Upload rejected — validation failed');
        return;
      }
      
      // Handle file too large errors (status 413)
      if (err.response?.status === 413 || err.message?.includes('413')) {
        setValidationError('The video file is too large for the server. Please try a smaller file (under 100MB is recommended) or increase your server upload limits (Nginx client_max_body_size and PHP upload_max_filesize).');
        setStatus('error');
        setStatusMessage('Upload failed: File too large');
        return;
      }
      
      setStatus('error');
      setStatusMessage(err.response?.data?.message || err.message || 'Something went wrong during upload.');
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-300">
            <Video className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter">Video Settings</h3>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-[10px] text-gray-400 font-bold tracking-widest">Lesson Builder + AI Assistant</p>
               {finalVideoUrl && (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                   <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">video ready</span>
                 </div>
               )}
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-400">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-8">
        {/* Validation error */}
        {validationError && (
          <div className="mb-6 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="font-black text-red-800 text-sm mb-1 tracking-widest">Validation Error</p>
              <p className="text-red-700/80 text-sm font-medium leading-relaxed">{validationError}</p>
            </div>
          </div>
        )}

        {/* Status feedback */}
        {status === 'done' && (
          <div className="space-y-6">
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-4">
              <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <p className="font-black text-emerald-800 text-sm mb-1 tracking-widest">Intelligence Ready</p>
                <p className="text-emerald-700/80 text-sm font-medium leading-relaxed">{statusMessage}</p>
                <div className="mt-4 flex items-center gap-2 p-2.5 bg-emerald-600/10 border border-emerald-600/20 rounded-xl">
                   <Brain className="text-emerald-600" size={16} />
                   <span className="text-[10px] font-black text-emerald-600 tracking-widest">Assistant context active</span>
                </div>
              </div>
            </div>

            {/* Video Preview Player */}
            {finalVideoUrl && (
              <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] overflow-hidden">
                {showVideoPreview ? (
                  <div>
                    <video
                      src={getVideoPreviewUrl(finalVideoUrl)}
                      controls
                      className="w-full max-h-[400px] object-contain bg-black"
                      onError={() => setShowVideoPreview(false)}
                    />
                  </div>
                ) : (
                  <div 
                    onClick={() => setShowVideoPreview(true)}
                    className="p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Play className="text-blue-600" size={28} />
                    </div>
                    <p className="font-black text-gray-900 text-sm mb-1">Video Preview Ready</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Click to play preview</p>
                  </div>
                )}
              </div>
            )}

            {/* Transcription Editor */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-8">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <Sparkles className="text-blue-500" size={18} />
                     <h4 className="text-xs font-black text-gray-900 tracking-[0.2em]">AI Generated Transcript</h4>
                  </div>
                  {!isEditingTranscript ? (
                     <button 
                        onClick={() => setIsEditingTranscript(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-500 tracking-widest hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                     >
                        <Edit3 size={14} /> Refine Script
                     </button>
                  ) : (
                     <button 
                        onClick={handleUpdateTranscript}
                        disabled={isSavingTranscript}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                     >
                        {isSavingTranscript ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Refinement
                     </button>
                  )}
               </div>

               {isEditingTranscript ? (
                  <textarea 
                     value={transcription}
                     onChange={(e) => setTranscription(e.target.value)}
                     className="w-full min-h-[200px] p-6 bg-white border border-blue-100 rounded-2xl text-sm font-medium leading-relaxed focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                  />
               ) : (
                  <div className="max-h-[200px] overflow-y-auto pr-4 scrollbar-thin">
                     <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                        {transcription || "No transcription text available."}
                     </p>
                  </div>
               )}
            </div>

            <div className="flex items-center gap-3">
              <button 
                 onClick={() => { setStatus('idle'); setTranscription(''); setFinalVideoUrl(''); setShowVideoPreview(false); }}
                 className="flex-1 py-4 text-[10px] font-black text-gray-400 tracking-[0.2em] hover:text-gray-900 transition-colors"
              >
                 Reset & Re-upload Video
              </button>
              {finalVideoUrl && (
                <a
                  href={getVideoPreviewUrl(finalVideoUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-blue-200 rounded-xl text-[10px] font-black text-blue-600 tracking-widest hover:bg-blue-50 transition-all"
                >
                  <Eye size={14} /> Open in New Tab
                </a>
              )}
            </div>
          </div>
        )}

        {status === 'error' && !validationError && (
          <div className="mb-6 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="font-black text-red-800 text-sm mb-1 tracking-widest">System Error</p>
              <p className="text-red-700/80 text-sm font-medium leading-relaxed">{statusMessage}</p>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'transcribing') && (
          <div className="mb-6 p-10 bg-blue-50/50 border border-blue-50 rounded-[2.5rem] flex flex-col items-center text-center">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
               <Loader2 className="text-blue-600 animate-spin relative" size={48} />
            </div>
            <p className="text-blue-900 font-black text-sm tracking-widest mb-2">{statusMessage}</p>
            <p className="text-blue-600/60 text-xs font-medium mb-8 italic">Please keep this window open while the engines process.</p>
            
            {status === 'uploading' && (
              <div className="w-full max-w-md bg-blue-100 rounded-full h-2 shadow-inner">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {status === 'transcribing' && (
              <div className="w-full max-w-md bg-purple-100 rounded-full h-2 overflow-hidden shadow-inner">
                <div className="bg-purple-600 h-2 rounded-full animate-marquee w-full" />
              </div>
            )}
          </div>
        )}

        {status !== 'done' && status !== 'uploading' && status !== 'transcribing' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase">Primary Master File</label>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">MP4, MOV, WEBM</span>
                  </div>
                </div>
                
                {file ? (
                  <div className="flex items-center justify-between p-6 bg-blue-50/30 border border-blue-100 rounded-[2rem]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Video className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm line-clamp-1 max-w-[300px]">{file.name}</p>
                        <p className="text-[10px] font-bold text-blue-500/70 tracking-wider mt-0.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to deploy
                        </p>
                      </div>
                    </div>
                    <button onClick={clearFile} className="text-blue-400 hover:text-red-500 transition-colors p-2">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div
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
                          handleSubmit(undefined, droppedFile);
                        }
                      }
                    }}
                    className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all group shadow-inner bg-white"
                  >
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 transition-colors">
                       <Upload className="text-gray-300 group-hover:text-blue-500 transition-all" size={32} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 tracking-tighter text-lg mb-2">Deploy Local Master</p>
                      <p className="text-[10px] font-black text-gray-400 tracking-widest">MP4, MOV or WEBM preferred</p>
                      <p className="text-[10px] font-medium text-gray-300 mt-2 max-w-sm mx-auto">
                        Videos are analysed for quality (720p minimum, under 7 minutes recommended)
                      </p>
                    </div>
                  </div>
                )}
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </div>

              <div className="pt-4 text-center">
                 <p className="text-[10px] text-gray-300 font-bold tracking-widest leading-relaxed">
                   By uploading, your video is instantly transcribed <br /> and added to the course knowledge base.
                 </p>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}