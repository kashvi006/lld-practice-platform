import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, CheckCircle, Terminal, Sparkles, BookOpen, Clock, BarChart3, AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { ProblemSummary, RecentAttemptItem } from '../types/index.js';
import { DifficultyBadge } from '../components/DifficultyBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ScoreGauge } from '../components/ScoreGauge.js';

export const DashboardPage: React.FC = () => {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [problemsData, attemptsData] = await Promise.all([
          api.getProblems(),
          api.getRecentAttempts(5)
        ]);
        setProblems(problemsData);
        setRecentAttempts(attemptsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900/60 to-slate-950 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Practice • Explainable Evaluation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Stop Guessing If Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200">LLD Designs</span> Are Good.
          </h1>

          <p className="mt-4 text-slate-400 text-base sm:text-lg leading-relaxed">
            Practice classic Low-Level Design interview problems, submit structured architectural decisions, and receive actionable, rubric-driven feedback explaining <strong>evidence</strong>, <strong>concerns</strong>, and <strong>top improvements</strong> for your next attempt.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#problems"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-lg shadow-sky-600/25 transition-all"
            >
              <span>Explore Problems</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="flex items-center gap-4 text-xs text-slate-400 border-l border-slate-800 pl-4">
              <div>
                <span className="font-bold text-white text-sm block">8-Point</span>
                <span>Fixed Rubric</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="font-bold text-white text-sm block">Evidence-Based</span>
                <span>Actionable Advice</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Problems Grid */}
      <section id="problems" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-sky-400" />
              <span>Available Practice Problems</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select an LLD problem, inspect functional scope & constraints, and start practicing.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problems.map(problem => (
              <div
                key={problem.id}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 p-6 flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-sky-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <span className="text-xs text-slate-400 font-mono">
                      {problem.attemptCount} {problem.attemptCount === 1 ? 'attempt' : 'attempts'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                    {problem.title}
                  </h3>

                  <p className="text-sm text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                    {problem.shortDescription}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    to={`/problems/${problem.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <span>View Requirements</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to={`/problems/${problem.slug}/attempts`}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    History
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Attempts Section */}
      {recentAttempts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>Recent Attempts</span>
          </h2>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
            <div className="divide-y divide-slate-800/80">
              {recentAttempts.map(attempt => (
                <div
                  key={attempt.id}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{attempt.problemTitle}</span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Attempt #{attempt.attemptNumber}
                      </span>
                      <DifficultyBadge difficulty={attempt.difficulty} />
                    </div>
                    <p className="text-xs text-slate-400">
                      Updated {new Date(attempt.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusBadge status={attempt.status} />
                    {attempt.score !== null && (
                      <ScoreGauge score={attempt.score} maxScore={attempt.maxScore} size="sm" />
                    )}

                    <Link
                      to={
                        attempt.status === 'COMPLETED' || attempt.status === 'FAILED'
                          ? `/attempts/${attempt.id}/evaluation`
                          : `/attempts/${attempt.id}/practice`
                      }
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      {attempt.status === 'COMPLETED' ? 'View Feedback' : 'Resume'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* The Learning Loop */}
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-8">
        <h3 className="text-lg font-bold text-white mb-2">The Explainable LLD Learning Loop</h3>
        <p className="text-xs text-slate-400 mb-6 max-w-2xl">
          Unlike generic interview platforms that only grade syntax or output a single number, this platform analyzes architectural choices and provides actionable steps so each attempt teaches you how to design better.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-sky-400 font-mono text-xs font-bold block mb-1">STEP 1</span>
            <h4 className="font-bold text-white text-sm">Read & Interpret</h4>
            <p className="text-xs text-slate-400 mt-1">Review requirements, constraints & domain boundaries.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-sky-400 font-mono text-xs font-bold block mb-1">STEP 2</span>
            <h4 className="font-bold text-white text-sm">Structure Design</h4>
            <p className="text-xs text-slate-400 mt-1">Articulate classes, responsibilities, trade-offs & OCP.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-sky-400 font-mono text-xs font-bold block mb-1">STEP 3</span>
            <h4 className="font-bold text-white text-sm">Receive Evidence</h4>
            <p className="text-xs text-slate-400 mt-1">See exact quotes, concerns, and suggestions per criterion.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-sky-400 font-mono text-xs font-bold block mb-1">STEP 4</span>
            <h4 className="font-bold text-white text-sm">Iterate & Improve</h4>
            <p className="text-xs text-slate-400 mt-1">Apply the top 3 recommendations in Attempt #2.</p>
          </div>
        </div>
      </section>
    </div>
  );
};