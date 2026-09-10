import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '../api/client.js';
import { AttemptDetail, EvaluationDetail } from '../types/index.js';
import { ScoreGauge } from '../components/ScoreGauge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { RubricCriterionCard } from '../components/RubricCriterionCard.js';
import { TopImprovementsCard } from '../components/TopImprovementsCard.js';
import { EvaluationStepper } from '../components/EvaluationStepper.js';

export const EvaluationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [startingNext, setStartingNext] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll evaluation status until completed or failed
  useEffect(() => {
    let intervalId: any = null;
    let isMounted = true;

    async function checkStatus() {
      if (!id) return;
      try {
        const attemptData = await api.getAttempt(id);
        if (!isMounted) return;

        setAttempt(attemptData);
        if (attemptData.evaluation) {
          setEvaluation(attemptData.evaluation);
        }

        setLoading(false);

        // If in terminal state (COMPLETED or FAILED), stop polling
        if (attemptData.status === 'COMPLETED' || attemptData.status === 'FAILED') {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to check evaluation status');
        setLoading(false);
      }
    }

    checkStatus();
    intervalId = setInterval(checkStatus, 1500);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [id]);

  const handleRetry = async () => {
    if (!id) return;
    try {
      setRetrying(true);
      await api.retryEvaluation(id);
      // Wait briefly and re-trigger check
      setTimeout(() => setRetrying(false), 500);
    } catch (err: any) {
      alert(`Could not retry evaluation: ${err.message}`);
      setRetrying(false);
    }
  };

  const handleStartNextAttempt = async () => {
    if (!attempt) return;
    try {
      setStartingNext(true);
      const nextAttempt = await api.createAttempt(attempt.problemId);
      navigate(`/attempts/${nextAttempt.id}/practice`);
    } catch (err: any) {
      alert(`Could not start next attempt: ${err.message}`);
      setStartingNext(false);
    }
  };

  if (loading && !attempt) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm">Fetching evaluation report...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 inline-block">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error || 'Attempt not found.'}</p>
        </div>
        <div>
          <Link to="/" className="text-sm text-sky-400 hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  // If in EVALUATING state, show live animated stepper
  if (attempt.status === 'SUBMITTED' || attempt.status === 'EVALUATING') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to={`/problems/${attempt.problem.slug}`}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Problem</span>
          </Link>
          <StatusBadge status={attempt.status} />
        </div>

        <EvaluationStepper attemptNumber={attempt.attemptNumber} />
      </div>
    );
  }

  // If FAILED, show recovery screen with Retry button
  if (attempt.status === 'FAILED') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-center">
        <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 shadow-2xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-white">Evaluation Encountered An Issue</h2>

          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {evaluation?.errorMessage || 'An error occurred while evaluating your submission.'}
          </p>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 text-left max-w-md mx-auto">
            <p className="font-bold text-slate-200 mb-1">Your Submission is Safe:</p>
            <p>
              Submissions are permanently recorded in the database before evaluation starts. You do not need to retype your design.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-4">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 transition-all"
            >
              {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              <span>Retry Evaluation</span>
            </button>

            <Link
              to={`/attempts/${attempt.id}/practice`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Edit Submission
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETED State: Full Feedback Report
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <Link
            to={`/problems/${attempt.problem.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Problem</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Evaluation Report: {attempt.problem.title}
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
              Attempt #{attempt.attemptNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/problems/${attempt.problem.slug}/attempts`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Attempt History</span>
          </Link>

          <button
            onClick={handleStartNextAttempt}
            disabled={startingNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition-all"
          >
            {startingNext ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>Try Again (Attempt #{attempt.attemptNumber + 1})</span>
          </button>
        </div>
      </div>

      {/* Score & Summary Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/60 to-slate-950 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-8 shadow-xl">
        <ScoreGauge
          score={evaluation?.overallScore ?? null}
          maxScore={evaluation?.maxOverallScore ?? 80}
        />

        <div className="flex flex-col items-start sm:items-end gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <StatusBadge status="COMPLETED" />
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-sky-400" />
              <span>Evaluator: {evaluation?.evaluatorType === 'AI' ? 'Gemini 2.5 AI' : 'Rule-Based Heuristic'}</span>
            </span>
          </div>
          <p className="font-mono text-[11px]">
            Evaluated on {evaluation?.completedAt ? new Date(evaluation.completedAt).toLocaleString() : 'Just now'}
          </p>
        </div>
      </div>

      {/* Top 3 Actionable Improvements */}
      {evaluation?.topImprovements && (
        <TopImprovementsCard improvements={evaluation.topImprovements} />
      )}

      {/* Strengths & Areas to Improve Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Identified Architectural Strengths</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {evaluation?.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Improve */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Key Areas for Refinement</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {evaluation?.areasToImprove.map((area, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Rubric Criteria Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Detailed 8-Point Rubric Evaluation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any criterion to inspect evidence quoted from your submission, identified concerns, and actionable advice.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {evaluation?.criteria.map((criterion, idx) => (
            <RubricCriterionCard
              key={criterion.id || criterion.criterionKey}
              criterion={criterion}
              defaultExpanded={idx === 0}
            />
          ))}
        </div>
      </section>

      {/* Inspect Submitted Design Accordion */}
      {attempt.submission && (
        <section className="border border-slate-800 rounded-2xl bg-slate-900/30 overflow-hidden">
          <button
            onClick={() => setShowSubmission(!showSubmission)}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none hover:bg-slate-900/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Your Submitted Design</h3>
                <p className="text-xs text-slate-400">
                  Inspect the original 11 sections submitted for this attempt
                </p>
              </div>
            </div>
            <div className="text-slate-400">
              {showSubmission ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {showSubmission && (
            <div className="p-5 border-t border-slate-800 space-y-4 bg-slate-950/60 font-mono text-xs text-slate-300">
              {Object.entries(attempt.submission.content).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <span className="text-sky-400 font-bold uppercase text-[11px] block">{key}:</span>
                  <p className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 whitespace-pre-wrap leading-relaxed text-slate-200">
                    {val}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Bottom CTA Loop */}
      <div className="p-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-sky-950/20 to-slate-900 flex flex-wrap items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1 max-w-lg">
          <h3 className="text-lg font-bold text-white">Ready for Attempt #{attempt.attemptNumber + 1}?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Apply the top 3 recommendations from this report to improve your class separation, abstractions, and concurrency handling.
          </p>
        </div>

        <button
          onClick={handleStartNextAttempt}
          disabled={startingNext}
          className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2"
        >
          {startingNext ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          <span>Start Attempt #{attempt.attemptNumber + 1}</span>
        </button>
      </div>
    </div>
  );
};