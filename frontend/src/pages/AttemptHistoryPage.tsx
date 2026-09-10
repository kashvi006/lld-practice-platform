import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, History, Calendar, Award, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { ProblemDetail, AttemptListItem } from '../types/index.js';
import { DifficultyBadge } from '../components/DifficultyBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ScoreGauge } from '../components/ScoreGauge.js';

export const AttemptHistoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [attempts, setAttempts] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        setLoading(true);
        const [probData, attData] = await Promise.all([
          api.getProblem(slug),
          api.getProblemAttempts(slug)
        ]);
        setProblem(probData);
        setAttempts(attData);
      } catch (err: any) {
        setError(err.message || 'Failed to load attempt history');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const handleStartAttempt = async () => {
    if (!problem) return;
    try {
      setStartingAttempt(true);
      const newAttempt = await api.createAttempt(problem.id);
      navigate(`/attempts/${newAttempt.id}/practice`);
    } catch (err: any) {
      alert(`Could not start attempt: ${err.message}`);
      setStartingAttempt(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm">Loading attempt history...</p>
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
          to={`/problems/${problem.slug}`}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Problem Requirements</span>
        </Link>

        <button
          onClick={handleStartAttempt}
          disabled={startingAttempt}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-sky-600/20 transition-all"
        >
          {startingAttempt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
          <span>Start New Attempt</span>
        </button>
      </div>

      {/* Problem Summary Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
        <div className="flex items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="text-xs text-slate-400 font-mono">Attempt Progression History</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{problem.title}</h1>
        <p className="text-xs text-slate-400">{problem.shortDescription}</p>
      </div>

      {/* Attempts List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-sky-400" />
          <span>Your Attempts ({attempts.length})</span>
        </h2>

        {attempts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
            <p className="text-slate-400 text-sm">No attempts recorded for this problem yet.</p>
            <button
              onClick={handleStartAttempt}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Attempt #1</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map(att => (
              <div
                key={att.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-all flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-base text-white">
                      Attempt #{att.attemptNumber}
                    </span>
                    <StatusBadge status={att.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(att.createdAt).toLocaleDateString()} at {new Date(att.createdAt).toLocaleTimeString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {att.score !== null && (
                    <ScoreGauge score={att.score} maxScore={att.maxScore} size="sm" />
                  )}

                  <Link
                    to={
                      att.status === 'COMPLETED' || att.status === 'FAILED'
                        ? `/attempts/${att.id}/evaluation`
                        : `/attempts/${att.id}/practice`
                    }
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {att.status === 'COMPLETED' ? 'View Feedback' : 'Resume Attempt'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};