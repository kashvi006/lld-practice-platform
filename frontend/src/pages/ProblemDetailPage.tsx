import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  History,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Lightbulb,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client.js';
import { ProblemDetail } from '../types/index.js';
import { DifficultyBadge } from '../components/DifficultyBadge.js';

export const ProblemDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProblem() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await api.getProblem(slug);
        setProblem(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load problem');
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
  }, [slug]);

  const handleStartAttempt = async () => {
    if (!problem) return;
    try {
      setStartingAttempt(true);
      const attempt = await api.createAttempt(problem.id);
      navigate(`/attempts/${attempt.id}/practice`);
    } catch (err: any) {
      alert(`Could not start attempt: ${err.message}`);
      setStartingAttempt(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm">Loading problem statement and rubric...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 inline-block">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error || 'Problem not found.'}</p>
        </div>
        <div>
          <Link to="/" className="text-sm text-sky-400 hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Problems</span>
        </Link>

        <Link
          to={`/problems/${problem.slug}/attempts`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-300 transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          <History className="w-3.5 h-3.5" />
          <span>Past Attempts</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="text-xs text-slate-400 font-mono">LLD Core Problem</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {problem.title}
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          {problem.shortDescription}
        </p>

        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4">
          <button
            onClick={handleStartAttempt}
            disabled={startingAttempt}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-sky-600/25 transition-all"
          >
            {startingAttempt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>Start Practice</span>
          </button>
        </div>
      </div>

      {/* Problem Details Body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content (2 Cols) */}
        <div className="md:col-span-2 space-y-8">
          {/* Problem Statement */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Problem Statement</h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {problem.problemStatement}
            </p>
          </section>

          {/* Functional Requirements */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Functional Requirements</span>
            </h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {problem.functionalRequirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Constraints */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-400" />
              <span>Key Constraints & Concurrency</span>
            </h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {problem.constraints.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar Context (1 Col) */}
        <div className="space-y-6">
          {/* Assumptions / Guidance */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Assumptions & Prompts</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              {problem.assumptionsPrompts.map((a, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-slate-600">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Considerations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Suggested Considerations</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              {problem.suggestedConsiderations.map((sc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-slate-600">•</span>
                  <span>{sc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rubric Criteria Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Evaluation Rubric (8 Criteria)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Your design will be evaluated on evidence across each criterion (10 pts each, 80 total):
            </p>
            <div className="space-y-1.5 text-xs text-slate-300">
              {problem.rubric.map(c => (
                <div key={c.key} className="flex items-center justify-between py-1 border-b border-slate-800/60 text-[11px]">
                  <span>{c.name}</span>
                  <span className="font-mono text-slate-500">10 pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};