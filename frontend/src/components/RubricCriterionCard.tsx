import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Quote, AlertTriangle, Lightbulb, ShieldCheck } from 'lucide-react';
import { CriterionFeedback } from '../types/index.js';

interface Props {
  criterion: CriterionFeedback;
  defaultExpanded?: boolean;
}

export const RubricCriterionCard: React.FC<Props> = ({ criterion, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const percentage = (criterion.score / criterion.maxScore) * 100;

  let progressColor = 'bg-rose-500';
  let scoreColor = 'text-rose-400';
  if (criterion.score >= 8) {
    progressColor = 'bg-emerald-500';
    scoreColor = 'text-emerald-400';
  } else if (criterion.score >= 6) {
    progressColor = 'bg-amber-500';
    scoreColor = 'text-amber-400';
  }

  const confidenceColors: Record<string, string> = {
    HIGH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden transition-all hover:border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 select-none focus:outline-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h4 className="font-semibold text-slate-100 text-sm sm:text-base tracking-tight">
              {criterion.criterionName}
            </h4>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                confidenceColors[criterion.confidence] || confidenceColors.MEDIUM
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {criterion.confidence} Confidence
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-36 sm:w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className={`font-mono text-xs sm:text-sm font-bold ${scoreColor}`}>
              {criterion.score} <span className="text-slate-500 text-xs font-normal">/ {criterion.maxScore}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200">
          <span className="text-xs hidden sm:inline">{isExpanded ? 'Hide Details' : 'View Analysis'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 sm:p-5 space-y-4 text-sm animate-fadeIn">
          {/* Evidence from learner's submission */}
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Quote className="w-3.5 h-3.5" />
              <span>Evidence from Your Submission</span>
            </div>
            <p className="text-slate-300 font-mono text-xs leading-relaxed italic">
              "{criterion.evidence}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Concern / Why it matters */}
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Concern / Why It Matters</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {criterion.concern}
              </p>
            </div>

            {/* Actionable Suggestion */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Actionable Suggestion</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {criterion.suggestion}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};