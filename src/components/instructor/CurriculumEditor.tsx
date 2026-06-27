'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Section, Lesson } from '@/types/curriculum';
import VideoUploader from '@/components/instructor/VideoUploader';
import TextEditor from '@/components/instructor/TextEditor';
import QuizEditor from '@/components/instructor/QuizEditor';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Video, 
  FileText, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CurriculumEditorProps {
  courseId: number;
  initialSections: Section[];
}

const CurriculumEditor: React.FC<CurriculumEditorProps> = ({ courseId, initialSections }) => {
  const [sections, setSections] = useState<Section[]>(initialSections);

  const fetchSections = async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setSections(res.data.sections);
    } catch (err) {
      console.error("Failed to refresh curriculum", err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        const newArray = arrayMove(items, oldIndex, newIndex);
        
        const payload = newArray.map((sec, idx) => ({ id: sec.id, sortOrder: idx + 1 }));
        api.put(`/instructor/courses/${courseId}/update-sections-order`, { sections: payload }).catch(err => {
            console.error("Failed to update section order", err);
        });

        return newArray;
      });
    }
  };

  const handleAddSection = async () => {
    const newTitle = "New Section";
    try {
      const response = await api.post(`/instructor/courses/${courseId}/sections`, { title: newTitle });
      
      // Extract section data from common Laravel response patterns
      const sectionData = response.data.data || response.data.section || response.data;
      
      if (!sectionData.id) {
         console.error("API response missing section ID", response.data);
         return;
      }

      setSections([...sections, { ...sectionData, lessons: [] }]);
    } catch (error) {
      console.error("Failed to add section", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight ">Course Curriculum</h3>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          <SortableContext 
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableSectionItem 
                key={section.id} 
                section={section} 
                courseId={courseId}
                onDelete={(id) => setSections(sections.filter(s => s.id !== id))}
                fetchSections={fetchSections}
              />
            ))}
          </SortableContext>

          <div className="pt-8">
            <button 
              onClick={handleAddSection}
              className="w-full py-10 bg-gray-50/30 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex items-center justify-center text-blue-600/70 font-black text-sm tracking-widest hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 transition-all gap-3 bg-white"
            >
              <Plus size={20} /> Add New Section
            </button>
          </div>
        </div>
      </DndContext>
    </div>
  );
};

const SortableSectionItem = ({ section, courseId, onDelete, fetchSections }: { section: Section, courseId: number, onDelete: (id: number) => void, fetchSections: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [lessons, setLessons] = useState<Lesson[]>(section.lessons || []);

  useEffect(() => {
    if (section.lessons) {
      setLessons(section.lessons);
    }
  }, [section.lessons]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleLessonDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);
      const newArray = arrayMove(lessons, oldIndex, newIndex);
      
      setLessons(newArray);

      try {
        const payload = newArray.map((lesson, idx) => ({ id: lesson.id, sortOrder: idx + 1 }));
        await api.put(`/instructor/courses/${courseId}/update-lessons-order`, { lessons: payload });
      } catch (err) {
        console.error("Failed to update lesson order", err);
      }
    }
  };

  const handleSaveTitle = async () => {
    try {
      await api.post(`/instructor/courses/${courseId}/sections/${section.id}/edit`, { title });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update section title", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this section?")) {
      try {
        await api.delete(`/instructor/course-sections/${section.id}`);
        onDelete(section.id);
      } catch (error) {
        console.error("Failed to delete section", error);
        onDelete(section.id);
      }
    }
  };

  const handleAddLesson = async (type: string = 'video') => {
    // Ensure we have a valid section ID
    const sectionId = section.id || (section as any).data?.id;
    if (!sectionId) {
      console.error("Cannot add lesson: Missing section ID", section);
      return;
    }

    try {
      const typeIcons = {
        video: "Video Lecture",
        text: "Reference Material",
        quiz: "Lesson Quiz"
      };
      
      const response = await api.post(`/instructor/courses/${courseId}/sections/${sectionId}/lessons`, { 
        title: (typeIcons as any)[type] || "New Lesson", 
        lesson_type: type,
        section_id: sectionId
      });
      
      // Handle both flat and nested data structures (Laravel Resource vs Model)
      const newLesson = response.data.data || response.data.lesson || response.data;
      
      // Ensure the lesson has the correct type for local UI state
      if (newLesson && !newLesson.lesson_type) {
        newLesson.lesson_type = type;
      }

      setLessons([...lessons, { ...newLesson, _autoOpen: true }]);
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add lesson", error);
      setIsAdding(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border ${isDragging ? 'border-blue-400 shadow-xl opacity-80' : 'border-gray-100 shadow-sm'} rounded-2xl overflow-hidden transition-shadow`}>
      <div className="bg-gray-50/50 p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center flex-grow">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 mr-2 hover:bg-gray-200 rounded">
            <GripVertical className="text-gray-400" size={20} />
          </div>
          
          {isEditing ? (
            <div className="flex items-center space-x-2 flex-grow max-w-md">
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="flex-grow bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                autoFocus
                onKeyDown={(e) => {
                   if (e.key === 'Enter') handleSaveTitle();
                   if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <button onPointerDown={(e) => { e.preventDefault(); handleSaveTitle(); }} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Check size={16} />
              </button>
              <button onPointerDown={(e) => { e.preventDefault(); setIsEditing(false); }} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center group">
              <span 
                className="font-black text-gray-900 tracking-tight mr-3 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                {title}
              </span>
              <button onPointerDown={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600">
                <Edit3 size={14} />
              </button>
            </div>

          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button onPointerDown={handleDelete} className="text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 size={18} />
          </button>
          <button onPointerDown={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-blue-600 transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleLessonDragEnd}
          >
            <SortableContext
               items={lessons.map(l => l.id)}
               strategy={verticalListSortingStrategy}
            >
              {lessons.map((lesson) => (
                <SortableLessonItem 
                  key={lesson.id} 
                  lesson={lesson} 
                  courseId={courseId}
                  onDelete={(id) => setLessons(lessons.filter(l => l.id !== id))} 
                  fetchSections={fetchSections}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          <div className="pt-2">
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full h-14 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-all gap-2"
              >
                <Plus size={14} /> Add New Lecture
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                 <button onClick={() => handleAddLesson('video')} className="flex-1 h-12 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px]  tracking-widest flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                    <Video size={14} /> Video
                 </button>
                 <button onClick={() => handleAddLesson('text')} className="flex-1 h-12 bg-purple-50 text-purple-600 rounded-xl font-black text-[10px]  tracking-widest flex items-center justify-center gap-2 border border-purple-100 hover:bg-purple-600 hover:text-white transition-all">
                    <FileText size={14} /> Text
                 </button>
                 <button onClick={() => handleAddLesson('quiz')} className="flex-1 h-12 bg-orange-50 text-orange-600 rounded-xl font-black text-[10px]  tracking-widest flex items-center justify-center gap-2 border border-orange-100 hover:bg-orange-600 hover:text-white transition-all">
                    <HelpCircle size={14} /> Quiz
                 </button>
                 <button onClick={() => setIsAdding(false)} className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all">
                    <X size={16} />
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SortableLessonItem = ({ lesson, courseId, onDelete, fetchSections }: { lesson: Lesson, courseId: number, onDelete: (id: number) => void, fetchSections: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [isPreview, setIsPreview] = useState(lesson.content?.is_preview || false);
  const [showUploader, setShowUploader] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  
  useEffect(() => {
    if (lesson._autoOpen) {
      if (lesson.lesson_type === 'quiz') setShowQuizEditor(true);
      else if (lesson.lesson_type === 'text') setShowTextEditor(true);
      else setShowUploader(true);
    }
  }, [lesson.id, lesson._autoOpen, lesson.lesson_type]);

  const hasVideo = !!lesson.content?.video_url;
  const hasDocument = !!lesson.content?.document_url;
  const hasBody = !!lesson.content?.body;

  const getTypeIcon = () => {
    if (lesson.lesson_type === 'quiz') return <HelpCircle size={16} className="text-orange-500" />;
    if (lesson.lesson_type === 'text') return <FileText size={16} className="text-purple-500" />;
    return <Video size={16} className="text-blue-500" />;
  };

  const handleSaveTitle = async () => {
    try {
      await api.post(`/instructor/lecture/${lesson.id}/update`, { title });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update lesson title", err);
    }
  };

  const togglePreview = async () => {
    try {
      const newVal = !isPreview;
      setIsPreview(newVal);
      await api.post(`/instructor/lessons/${lesson.id}/update-meta`, { is_preview: newVal });
      toast.success(newVal ? "Lesson marked as free preview" : "Lesson locked for enrolled students");
    } catch (err) {
      console.error("Failed to update preview status", err);
      setIsPreview(!isPreview);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete this lesson permanently?")) {
      try {
        await api.delete(`/instructor/lesson/${lesson.id}/delete`);
        onDelete(lesson.id);
      } catch (err) {
        console.error("Failed to delete lesson", err);
      }
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div 
        className={`flex items-center justify-between p-4 ${isDragging ? 'bg-blue-50 border-blue-200 shadow-xl z-20' : 'bg-white border-gray-100'} border rounded-2xl hover:border-blue-100 hover:shadow-lg transition-all group group/lesson`}
      >
        <div className="flex items-center flex-grow">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 -ml-2 mr-3 hover:bg-gray-100 rounded-xl transition-colors">
            <GripVertical className="text-gray-300" size={18} />
          </div>
          
          <div 
            className={cn(
              "p-3 rounded-xl transition-all cursor-pointer shadow-sm border",
              lesson.lesson_type === 'quiz' ? "bg-orange-50 border-orange-100 group-hover/lesson:bg-orange-600 group-hover/lesson:text-white" :
              lesson.lesson_type === 'text' ? "bg-purple-50 border-purple-100 group-hover/lesson:bg-purple-600 group-hover/lesson:text-white" :
              "bg-blue-50 border-blue-100 group-hover/lesson:bg-blue-600 group-hover/lesson:text-white"
            )}
            onClick={() => {
              if (lesson.lesson_type === 'quiz') setShowQuizEditor(true);
              else if (lesson.lesson_type === 'text') setShowTextEditor(!showTextEditor);
              else setShowUploader(!showUploader);
            }}
          >
            {getTypeIcon()}
          </div>
          
          <div className="ml-4 flex-grow">
            {isEditing ? (
              <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <input 
                  autoFocus
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white border border-blue-200 rounded-xl px-4 py-2 text-sm font-black text-gray-900 focus:ring-4 focus:ring-blue-50 outline-none w-full max-w-md shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <button onPointerDown={(e) => { e.preventDefault(); handleSaveTitle(); }} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"><Check size={18} /></button>
                <button onPointerDown={(e) => { e.preventDefault(); setIsEditing(false); }} className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={18} /></button>
              </div>
            ) : (
                <div className="flex items-center gap-3">
                  <span 
                    className="text-sm font-black text-gray-900 group-hover/lesson:text-blue-600 transition-colors cursor-pointer leading-tight tracking-tight italic" 
                    onClick={() => {
                      if (lesson.lesson_type === 'quiz') setShowQuizEditor(true);
                      else if (lesson.lesson_type === 'text') setShowTextEditor(!showTextEditor);
                      else setShowUploader(!showUploader);
                    }}
                  >
                    {title}
                  </span>
                  
                  <div className="flex items-center gap-1.5 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                    {isPreview && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest italic rounded-full">Preview Mode</span>}
                    <ContentSummary lesson={lesson} />
                  </div>
                </div>
            )}
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-2 opacity-0 group-hover/lesson:opacity-100 transition-all">
            <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
               <button
                 onPointerDown={() => setShowSettings(!showSettings)}
                 className={cn(
                   "p-2.5 rounded-xl transition-all",
                   showSettings ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-900 hover:bg-white"
                 )}
                 title="Individual Modification Panel"
               >
                 <Settings size={18} />
               </button>
               <button
                 onPointerDown={() => setShowTextEditor(v => !v)}
                 className={cn(
                    "p-2.5 rounded-xl transition-all",
                    showTextEditor ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-purple-600 hover:bg-white"
                 )}
                 title="Content Editor"
               >
                 <Edit3 size={18} />
               </button>
               <button onPointerDown={handleDelete} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all" title="Terminate Component">
                 <Trash2 size={18} />
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Modification Panel */}
      {showSettings && (
        <div className="mx-6 p-8 bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden group/panel">
           <div className="absolute top-0 right-0 p-20 bg-blue-600/10 blur-[60px] rounded-full -mr-10 -mt-10" />
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h4 className="text-sm font-black text-white tracking-[0.15em] uppercase italic">Individual Modification Panel</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Component UID: #{lesson.id.toString().padStart(6, '0')}</p>
                 </div>
                 <button onClick={() => setShowSettings(false)} className="p-2 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors">
                    <X size={16} />
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                       <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-gray-300 uppercase tracking-widest italic">Public Preview</label>
                          <button
                            onClick={togglePreview}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative shadow-inner",
                              isPreview ? "bg-emerald-600" : "bg-white/10"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all",
                              isPreview ? "right-1" : "left-1"
                            )} />
                          </button>
                       </div>
                       <p className="text-[10px] font-bold text-gray-500 leading-relaxed">Allow guests to view this specific component without enrolling in the course.</p>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                       <label className="text-xs font-black text-gray-300 uppercase tracking-widest italic block">Identifier Label</label>
                       <div className="flex items-center gap-4">
                          <input 
                            type="text" 
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                          <button onClick={handleSaveTitle} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Update</button>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 shadow-inner">
                       {getTypeIcon()}
                    </div>
                    <div>
                       <p className="text-xs font-black text-white uppercase tracking-widest">{lesson.lesson_type?.replace(/_/g, ' ')} Module</p>
                       <p className="text-[10px] font-bold text-gray-500 mt-1">Configure individual sub-components of this module.</p>
                    </div>
                    <div className="w-full pt-4 space-y-2">
                       <button onClick={() => { setShowSettings(false); setShowTextEditor(true); }} className="w-full py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-gray-300 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                          <FileText size={14} /> Modify Content
                       </button>
                       <button onClick={handleDelete} className="w-full py-3 bg-red-600/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
                          <Trash2 size={14} /> Terminate Record
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showUploader && lesson.lesson_type !== 'quiz' && (
        <div className="mx-6 mb-4 animate-in slide-in-from-top-4 duration-500">
          <VideoUploader
            lessonId={lesson.id}
            courseId={courseId}
            initialVideoUrl={lesson.content?.video_url || null}
            onTranscribed={() => setShowUploader(false)}
            onClose={() => setShowUploader(false)}
          />
        </div>
      )}

      {showTextEditor && lesson.lesson_type !== 'quiz' && (
        <div className="mx-6 mb-4 animate-in slide-in-from-top-4 duration-500">
          <TextEditor
            lessonId={lesson.id}
            courseId={courseId}
            initialBody={lesson.content?.body || ''}
            initialDocumentUrl={lesson.content?.document_url || null}
            initialImageUrl={lesson.content?.image_url || null}
            onClose={() => setShowTextEditor(false)}
            onSaved={() => {
              setShowTextEditor(false);
              fetchSections();
            }}
          />
        </div>
      )}

      {showQuizEditor && (
        <div className="animate-in zoom-in-95 duration-500">
          <QuizEditor 
            lessonId={lesson.id}
            courseId={courseId}
            onClose={() => {
              setShowQuizEditor(false);
              fetchSections();
            }}
          />
        </div>
      )}
    </div>
  );
};

function ContentSummary({ lesson }: { lesson: Lesson }) {
   if (lesson.lesson_type === 'quiz') return <span className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black uppercase tracking-widest italic rounded-full">Quiz Core</span>;
   
   const hasVideo = !!lesson.content?.video_url;
   const hasText = !!lesson.content?.body && lesson.content.body.length > 50;
   const hasDoc = !!lesson.content?.document_url;

   return (
      <div className="flex items-center gap-1.5">
         {hasVideo && <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest italic rounded-full">Vision Ready</span>}
         {hasText && <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-black uppercase tracking-widest italic rounded-full">Article Core</span>}
         {hasDoc && <span className="px-3 py-1 bg-gray-50 text-gray-500 border border-gray-100 text-[10px] font-black uppercase tracking-widest italic rounded-full">Artifact</span>}
         {!hasVideo && !hasText && !hasDoc && <span className="px-3 py-1 bg-red-50 text-red-400 border border-red-50 text-[10px] font-black uppercase tracking-widest italic rounded-full opacity-50">Empty Shell</span>}
      </div>
   );
}


export default CurriculumEditor;