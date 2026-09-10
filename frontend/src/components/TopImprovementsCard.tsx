import React from 'react';
import { Target, ArrowRight } from 'lucide-react';

interface Props {
  improvements: string[];
}

export const TopImprovementsCard: React.FC<Props> = ({ improvements }) => {
  if (!improvements || improvements.length === 0) return null;

  return (
    <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-slate-900 to-indigo-950/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="flex items-center gap-2 text-sky-400 font-bold text-sm tracking-wide uppercase mb-3">
        <Target className="w-4 h-4 text-sky-400" />
        <span>Top 3 Actionable Improvements For Your Next Attempt</span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Apply these high-leverage architectural refinements on your next attempt to elevate your score:
      </p>

      <div className="space-y-3">
        {improvements.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm leading-relaxed"
          >
            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-sky-500/30">
              {idx + 1}
            </div>
            <div className="flex-1">
              <span>{item.replace(/^\d+\.\s*/, '')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};