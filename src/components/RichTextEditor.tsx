'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Link as LinkIcon
} from 'lucide-react';
import React, { useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const buttons = [
    {
      icon: Bold,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: Italic,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: UnderlineIcon,
      title: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
    },
    {
      icon: Highlighter,
      title: 'Highlight',
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive('highlight'),
    },
    {
      icon: LinkIcon,
      title: 'Link',
      action: setLink,
      isActive: editor.isActive('link'),
    },
    { type: 'divider' },
    {
      icon: AlignLeft,
      title: 'Align Left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: editor.isActive({ textAlign: 'left' }),
    },
    {
      icon: AlignCenter,
      title: 'Align Center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: editor.isActive({ textAlign: 'center' }),
    },
    {
      icon: AlignRight,
      title: 'Align Right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: editor.isActive({ textAlign: 'right' }),
    },
    { type: 'divider' },
    {
      icon: List,
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: ListOrdered,
      title: 'Ordered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: Quote,
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
    },
    {
      icon: Code,
      title: 'Code Block',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive('codeBlock'),
    },
    { type: 'divider' },
    {
      icon: Undo,
      title: 'Undo',
      action: () => editor.chain().focus().undo().run(),
      isActive: false,
      disabled: !editor.can().undo(),
    },
    {
      icon: Redo,
      title: 'Redo',
      action: () => editor.chain().focus().redo().run(),
      isActive: false,
      disabled: !editor.can().redo(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
      {buttons.map((btn, i) => {
        if (btn.type === 'divider') {
          return <div key={i} className="w-px h-6 bg-gray-200 mx-1" />;
        }
        const Icon = btn.icon!;
        return (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault();
              if (btn.action) btn.action();
            }}
            disabled={btn.disabled}
            className={`p-2 rounded-lg transition-all ${
              btn.isActive 
                ? 'bg-purple-100 text-purple-600 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            } ${btn.disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            title={btn.title}
          >
            <Icon size={18} strokeWidth={2.5} />
          </button>
        );
      })}
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...', minHeight = '200px' }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none p-6 font-medium text-gray-700',
      },
    },
  });

  return (
    <div className="w-full bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-inner focus-within:ring-4 focus-within:ring-purple-50 focus-within:border-purple-300 transition-all relative">
      <MenuBar editor={editor} />
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div style={{ minHeight }} className="p-6 text-gray-300 animate-pulse">Initializing editor...</div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          min-height: ${minHeight};
          outline: none !important;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e9ecef;
          padding-left: 1rem;
          color: #6c757d;
          font-style: italic;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror code {
          background-color: #f8f9fa;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        .ProseMirror pre {
          background: #212529;
          color: #f8f9fa;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
      ` }} />
    </div>
  );
}
