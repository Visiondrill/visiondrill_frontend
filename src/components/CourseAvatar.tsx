import React from 'react';

const PALETTES = [
  ['#1e3a5f', '#2d7dd2', '#4cafe8'],  // Deep ocean blue
  ['#1a2e1a', '#2d7a2d', '#52c85e'],  // Forest green
  ['#3a1a3a', '#8b2fc9', '#c47de8'],  // Royal purple
  ['#3a1a1a', '#c94040', '#e87d7d'],  // Crimson red
  ['#1a2e3a', '#1e7fa0', '#52c0d4'],  // Teal
  ['#3a2a1a', '#c97d2f', '#e8b870'],  // Amber gold
  ['#1a1a3a', '#3040c9', '#7d8de8'],  // Electric blue
  ['#2a1a3a', '#9c4090', '#d480c8'],  // Magenta
];

function getIndexFromStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % PALETTES.length;
}

function getInitials(title: string): string {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

interface CourseAvatarProps {
  title: string;
  thumbnail?: string | null;
  className?: string;
  /** If true, renders an <img> when thumbnail is present, else falls back to the generated avatar */
  imgClassName?: string;
}

const CourseAvatar: React.FC<CourseAvatarProps> = ({
  title,
  thumbnail,
  className = 'w-full h-full',
  imgClassName = 'w-full h-full object-cover',
}) => {
  if (thumbnail) {
    return <img src={thumbnail} alt={title} className={imgClassName} loading="lazy" />;
  }

  const idx = getIndexFromStr(title || 'Course');
  const [bg, mid, accent] = PALETTES[idx];
  const initials = getInitials(title || 'C');

  return (
    <div
      className={`${className} relative flex items-center justify-center overflow-hidden select-none`}
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, ${mid} 60%, ${accent} 100%)`,
      }}
      aria-label={title}
    >
      {/* Abstract background shapes */}
      <div
        className="absolute -top-4 -right-4 w-28 h-28 rounded-full opacity-10"
        style={{ background: accent }}
      />
      <div
        className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full opacity-10"
        style={{ background: accent }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full opacity-5"
        style={{ background: accent }}
      />

      {/* Initials */}
      <span
        className="relative z-10 font-black text-white tracking-tighter"
        style={{
          fontSize: 'clamp(1.4rem, 4vw, 2.5rem)',
          textShadow: '0 2px 12px rgba(0,0,0,0.25)',
          letterSpacing: '-0.03em',
        }}
      >
        {initials}
      </span>
    </div>
  );
};

export default CourseAvatar;
