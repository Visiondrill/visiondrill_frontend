'use client';

import DOMPurify from 'isomorphic-dompurify';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SafeHTMLProps {
  html: string;
  className?: string;
  invert?: boolean;
}

export default function SafeHTML({ html, className, invert }: SafeHTMLProps) {
  const cleanHTML = DOMPurify.sanitize(html);

  return (
    <div 
      className={cn(
        'prose prose-sm sm:prose max-w-none text-inherit font-inherit', 
        invert && 'prose-invert',
        className
      )}
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
    />
  );
}
