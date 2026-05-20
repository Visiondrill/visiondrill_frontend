'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Upload, Link2, Loader2, CheckCircle, AlertCircle, Brain, Video, X, Edit3, Save, Sparkles } from 'lucide-react';

interface VideoUploaderProps {
  lessonId: number;
  courseId: number;
  onTranscribed?: (videoUrl: string) => void;
  onClose?: () => void;
}

export default function VideoUploader({ lessonId, courseId, onTranscribed, onClose }: VideoUploaderProps) {
  const [mode, setMode] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [finalVideoUrl, setFinalVideoUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if transcription already exists
    const checkExisting = async () => {
      try {
        const response = await api.get(`/ai/video-transcription/check?lesson_id=${lessonId}`);
        if (response.data.success && response.data.transcription) {
          setTranscription(response.data.transcription.transcription);
          setFinalVideoUrl(response.data.transcription.video_url);
          setStatus('done');
          setStatusMessage('Transcription found in system!');
        }
      } catch (err) {
        // Silently ignore check errors
      }
    };
    checkExisting();
  }, [lessonId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const uploadVideoFile = async (): Promise<string> => {
    if (!file) throw new Error('No file selected');

    // Mobile Bandwidth Optimization: Cap upload size on mobile devices to prevent timeouts and high data usage
    const MAX_MOBILE_FILE_MB = 50; 
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    
    if (isMobile && (file.size / 1024 / 1024) > MAX_MOBILE_FILE_MB) {
        throw new Error(`Mobile bandwidth limits: File exceeds ${MAX_MOBILE_FILE_MB}MB. Please compress your video or use a desktop/Wi-Fi connection to deploy this master file.`);
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/upload/${lessonId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total) setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
      },
    });
    return response.data.video_url;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('uploading');
    setStatusMessage('');

    try {
      let videoUrl = '';

      if (mode === 'youtube') {
        if (!youtubeUrl.trim()) throw new Error('Please enter a YouTube URL');
        videoUrl = youtubeUrl.trim();
        setUploadProgress(100);
      } else {
        setStatusMessage('Uploading video file…');
        videoUrl = await uploadVideoFile();
      }

      await requestTranscription(videoUrl);
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.response?.data?.message || err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
            <Video className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900  tracking-tighter">Transcription Studio</h3>
            <p className="text-[10px] text-gray-400 font-bold  tracking-widest mt-1">Lesson Architect • AI Engine active</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-400">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-8">
        {/* Status feedback */}
        {status === 'done' && (
          <div className="space-y-6">
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-4">
              <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <p className="font-black text-emerald-800 text-sm  mb-1 tracking-widest">Intelligence Ready</p>
                <p className="text-emerald-700/80 text-sm font-medium leading-relaxed">{statusMessage}</p>
                <div className="mt-4 flex items-center gap-2 p-2.5 bg-emerald-600/10 border border-emerald-600/20 rounded-xl">
                   <Brain className="text-emerald-600" size={16} />
                   <span className="text-[10px] font-black  text-emerald-600 tracking-widest">Assistant context active</span>
                </div>
              </div>
            </div>

            {/* Transcription Editor */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-8">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <Sparkles className="text-blue-500" size={18} />
                     <h4 className="text-xs font-black text-gray-900  tracking-[0.2em]">AI Generated Transcript</h4>
                  </div>
                  {!isEditingTranscript ? (
                     <button 
                        onClick={() => setIsEditingTranscript(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-500  tracking-widest hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                     >
                        <Edit3 size={14} /> Refine Script
                     </button>
                  ) : (
                     <button 
                        onClick={handleUpdateTranscript}
                        disabled={isSavingTranscript}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black  tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
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

            <button 
               onClick={() => { setStatus('idle'); setTranscription(''); }}
               className="w-full py-4 text-[10px] font-black text-gray-400  tracking-[0.2em] hover:text-gray-900 transition-colors"
            >
               Reset & Re-upload Video
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="font-black text-red-800 text-sm  mb-1 tracking-widest">Architect Error</p>
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
            <p className="text-blue-900 font-black text-sm  tracking-widest mb-2">{statusMessage}</p>
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Mode toggle */}
            <div className="flex p-2 space-x-2 bg-gray-50 border border-gray-100 rounded-[1.5rem]">
              <button
                type="button"
                onClick={() => setMode('youtube')}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 text-xs font-black  tracking-widest rounded-xl transition-all ${mode === 'youtube' ? 'bg-white shadow-xl text-gray-900 border border-gray-50' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Link2 size={16} /> Public Link
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 text-xs font-black  tracking-widest rounded-xl transition-all ${mode === 'upload' ? 'bg-white shadow-xl text-gray-900 border border-gray-50' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Upload size={16} /> File Drive
              </button>
            </div>

            {mode === 'youtube' ? (
              <div className="animate-in slide-in-from-bottom-2 duration-300">
                <label className="block text-[10px] font-black text-gray-400  tracking-widest mb-3">Public Video Identity</label>
                <div className="relative">
                  <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="url"
                    placeholder="Link lesson to YouTube, Vimeo or AWS S3..."
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50/30 border border-gray-100 rounded-3xl text-sm font-bold text-gray-900 focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-bottom-2 duration-300">
                <label className="block text-[10px] font-black text-gray-400  tracking-widest mb-3">Primary Master File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all group shadow-inner"
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 transition-colors">
                     <Upload className="text-gray-300 group-hover:text-blue-500 transition-all" size={32} />
                  </div>
                  {file ? (
                    <div>
                      <p className="font-black text-gray-900  tracking-tighter text-lg mb-1">{file.name}</p>
                      <p className="text-[10px] font-black text-gray-400  tracking-widest">Payload: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-black text-gray-900  tracking-tighter text-lg mb-2">Deploy Local Master</p>
                      <p className="text-[10px] font-black text-gray-400  tracking-widest">MP4, MOV or WEBM preferred</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
              </div>
            )}

            {/* AI Architecture info */}
            <div className="flex items-center gap-4 p-6 bg-gray-900 rounded-[2rem] shadow-2xl shadow-gray-200 border border-gray-800">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                 <Brain className="text-blue-400" size={24} />
              </div>
              <p className="text-xs text-white/70 font-medium leading-relaxed  tracking-widest">
                Our <span className="text-blue-400 font-black">Neural Engine</span> will instantly map this content to the lesson's AI Knowledge Base after processing.
              </p>
            </div>

            <button
              type="submit"
              className="w-full h-20 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200  tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <Sparkles size={20} className="text-blue-200" /> Start Transcription Engine
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
