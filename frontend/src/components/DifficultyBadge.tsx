import React from 'react';
import { Difficulty } from '../types/index.js';

interface Props {
  difficulty: Difficulty;
  className?: string;
}

export const DifficultyBadge: React.FC<Props> = ({ difficulty, className = '' }) => {
  const styles: Record<Difficulty, { bg: string; text: string; border: string }> = {
    EASY: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    },
    MEDIUM: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20'
    },
    HARD: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20'
    }
  };

  const style = styles[difficulty] || styles.MEDIUM;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {difficulty}
    </span>
  );
};