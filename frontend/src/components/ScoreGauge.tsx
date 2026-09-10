import React from 'react';

interface Props {
  score: number | null;
  maxScore: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreGauge: React.FC<Props> = ({ score, maxScore, size = 'md' }) => {
  if (score === null) {
    return <span className="text-slate-500 font-mono">-- / {maxScore}</span>;
  }

  const percentage = Math.round((score / maxScore) * 100);

  // Color selection
  let color = 'text-rose-400 stroke-rose-500';
  let badgeBg = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
  if (percentage >= 75) {
    color = 'text-emerald-400 stroke-emerald-500';
    badgeBg = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  } else if (percentage >= 50) {
    color = 'text-amber-400 stroke-amber-500';
    badgeBg = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-xs font-semibold border ${badgeBg}`}>
        <span>{score}/{maxScore}</span>
        <span className="opacity-75">({percentage}%)</span>
      </span>
    );
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`${color} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white leading-none">{percentage}%</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
        </div>
      </div>

      <div>
        <div className="text-3xl font-extrabold text-white">
          {score} <span className="text-slate-500 text-lg font-normal">/ {maxScore}</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Strictly derived sum of 8 rubric criteria</p>
      </div>
    </div>
  );
};