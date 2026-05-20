'use client';

import React, { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';
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
        
        // Push order to backend
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
      setSections([...sections, { ...response.data, lessons: [] }]);
    } catch (error) {
      console.error("Failed to add section", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight ">Course Curriculum</h3>
        <Button onClick={handleAddSection} className="flex items-center w-full sm:w-auto justify-center">
          <Plus size={18} className="mr-2" /> Add Section
        </Button>
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
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

const SortableSectionItem = ({ section, courseId, onDelete }: { section: Section, courseId: number, onDelete: (id: number) => void }) => {
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

      // Save to backend
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
        onDelete(section.id); // optimistic
      }
    }
  };

  const handleAddLesson = async (type: string = 'video') => {
    try {
      const typeIcons = {
        video: "Video Lecture",
        text: "Reference Material",
        quiz: "Lesson Quiz"
      };
      const response = await api.post(`/instructor/courses/${courseId}/sections/${section.id}/lessons`, { 
        title: (typeIcons as any)[type] || "New Lesson", 
        lesson_type: type === 'quiz' ? 'quiz' : 'lecture' 
      });
      setLessons([...lessons, response.data]);
    } catch (err) {
      console.error("Failed to add lesson", err);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border ${isDragging ? 'border-blue-400 shadow-xl opacity-80' : 'border-gray-100 shadow-sm'} rounded-2xl overflow-hidden transition-shadow`}>
      <div className="bg-gray-50/50 p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center flex-grow">
          {/* Drag Handle */}
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
                />
              ))}
            </SortableContext>
          </DndContext>
          
          <div className="pt-2">
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full h-12 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold text-xs  tracking-widest hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-all gap-2"
              >
                <Plus size={16} /> New Lesson
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                 <button onClick={() => { handleAddLesson('video'); setIsAdding(false); }} className="flex-1 h-12 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px]  tracking-widest flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                    <Video size={14} /> Video
                 </button>
                 <button onClick={() => { handleAddLesson('text'); setIsAdding(false); }} className="flex-1 h-12 bg-purple-50 text-purple-600 rounded-xl font-black text-[10px]  tracking-widest flex items-center justify-center gap-2 border border-purple-100 hover:bg-purple-600 hover:text-white transition-all">
                    <FileText size={14} /> Text
                 </button>
                 <button onClick={() => { handleAddLesson('quiz'); setIsAdding(false); }} className="flex-1 h-12 bg-orange-50 text-orange-600 rounded-xl font-black text-[10px]  tracking-widest flex items-center justify-center gap-2 border border-orange-100 hover:bg-orange-600 hover:text-white transition-all">
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

const SortableLessonItem = ({ lesson, courseId, onDelete }: { lesson: Lesson, courseId: number, onDelete: (id: number) => void }) => {
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
  const [title, setTitle] = useState(lesson.title);
  const [showUploader, setShowUploader] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  const getTypeIcon = () => {
    if (lesson.lesson_type === 'quiz') return <HelpCircle size={16} className="text-orange-500" />;
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
    <>
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`flex items-center justify-between p-3 pl-4 ${isDragging ? 'bg-blue-50 border-blue-200 shadow-lg z-20' : 'bg-white border-gray-50'} border rounded-xl hover:border-blue-100 hover:shadow-sm transition-all group`}
      >
        <div className="flex items-center flex-grow">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 mr-3 hover:bg-gray-100 rounded">
            <GripVertical className="text-gray-200" size={16} />
          </div>
          
          <div 
            className="mr-4 p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 cursor-pointer transition-colors"
            onClick={() => {
              if (lesson.lesson_type === 'quiz') setShowQuizEditor(true);
              else setShowTextEditor(!showTextEditor);
            }}
          >
            {getTypeIcon()}
          </div>

          
          {isEditing ? (
             <div className="flex items-center space-x-2">
                <input 
                   autoFocus
                   type="text" 
                   value={title} 
                   onChange={(e) => setTitle(e.target.value)}
                   className="bg-gray-50 border border-blue-200 rounded px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                   onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditing(false);
                   }}
                />
                <button onPointerDown={(e) => { e.preventDefault(); handleSaveTitle(); }} className="text-blue-600 hover:text-blue-800"><Check size={16} /></button>
                <button onPointerDown={(e) => { e.preventDefault(); setIsEditing(false); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
             </div>
          ) : (
              <div className="flex items-center gap-2">
                 <span 
                   className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors cursor-pointer" 
                   onClick={() => {
                     if (lesson.lesson_type === 'quiz') setShowQuizEditor(true);
                     else setShowTextEditor(!showTextEditor);
                   }}
                 >
                   {title}
                 </span>
                {lesson.lesson_type === 'quiz' && (
                  <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded  tracking-widest">Quiz Attached</span>
                )}
              </div>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
            {lesson.lesson_type === 'quiz' ? (
              <button
                onPointerDown={() => setShowQuizEditor(true)}
                className="p-1.5 text-orange-400 hover:text-orange-600 transition-colors"
                title="Manage Quiz Questions"
              >
                <HelpCircle size={16} />
              </button>
            ) : (
              <>
                <button
                  onPointerDown={() => setShowTextEditor(v => !v)}
                  className={`p-1.5 transition-colors ${showTextEditor ? 'text-purple-600 bg-purple-50 rounded-lg' : 'text-gray-400 hover:text-purple-600'}`}
                  title="Edit Text Content"
                >
                  <FileText size={16} />
                </button>
                <button
                  onPointerDown={() => setShowUploader(v => !v)}
                  className={`p-1.5 transition-colors ${showUploader ? 'text-blue-600 bg-blue-50 rounded-lg' : 'text-gray-400 hover:text-blue-600'}`}
                  title="Upload Video & Transcribe"
                >
                  <Video size={16} />
                </button>
              </>
            )}
            <button onPointerDown={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Edit Title">
              <Edit3 size={16} />
            </button>
            <button onPointerDown={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete Lesson">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {showUploader && lesson.lesson_type !== 'quiz' && (
        <div className="mx-2 mb-2">
          <VideoUploader
            lessonId={lesson.id}
            courseId={courseId}
            onTranscribed={() => setShowUploader(false)}
            onClose={() => setShowUploader(false)}
          />
        </div>
      )}

      {showTextEditor && lesson.lesson_type !== 'quiz' && (
        <div className="mx-2 mb-2">
          <TextEditor
            lessonId={lesson.id}
            courseId={courseId}
            onClose={() => setShowTextEditor(false)}
            onSaved={() => setShowTextEditor(false)}
          />
        </div>
      )}

      {showQuizEditor && (
        <QuizEditor 
          lessonId={lesson.id}
          courseId={courseId}
          onClose={() => setShowQuizEditor(false)}
        />
      )}
    </>
  );
};

export default CurriculumEditor;
