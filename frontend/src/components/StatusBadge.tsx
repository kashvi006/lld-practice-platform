import React from 'react';
import { CheckCircle2, Clock, Loader2, AlertCircle, Send } from 'lucide-react';
import { AttemptStatus } from '../types/index.js';

interface Props {
  status: AttemptStatus;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  switch (status) {
    case 'IN_PROGRESS':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>In Progress</span>
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ${className}`}>
          <Send className="w-3.5 h-3.5" />
          <span>Submitted</span>
        </span>
      );
    case 'EVALUATING':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse ${className}`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Evaluating...</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Evaluation Failed</span>
        </span>
      );
    default:
      return null;
  }
};