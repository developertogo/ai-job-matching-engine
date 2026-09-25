import React from 'react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  let colorStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (score < 75) {
    colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (score < 90) {
    colorStyles = 'bg-teal-500/10 text-teal-300 border-teal-500/30';
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1 font-semibold',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorStyles} ${sizeStyles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {Math.round(score)}% Match
    </span>
  );
}
