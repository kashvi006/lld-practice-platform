import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Sparkles, Cpu, GitCommit } from 'lucide-react';

interface Props {
  attemptNumber?: number;
}

export const EvaluationStepper: React.FC<Props> = ({ attemptNumber = 1 }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Submission Persisted', desc: 'Solution safely recorded in database' },
    { label: 'Analyzing Architecture', desc: 'Decomposing classes, responsibilities & SRP' },
    { label: 'Evaluating Coupling & Abstractions', desc: 'Checking interfaces, patterns & OCP extensibility' },
    { label: 'Scoring Against 8-Criteria Rubric', desc: 'Formulating evidence, concerns & actionable suggestions' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl text-center">
      <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
        <Sparkles className="w-7 h-7 animate-pulse" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-1">
        Evaluating Attempt #{attemptNumber}
      </h2>
      <p className="text-sm text-slate-400 mb-8">
        Our evaluation engine is analyzing your low-level design against the 8-point architectural rubric.
      </p>

      <div className="space-y-4 text-left max-w-lg mx-auto">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'border-sky-500/40 bg-sky-500/5 text-white'
                  : isDone
                  ? 'border-slate-800/80 bg-slate-950/40 text-slate-300'
                  : 'border-transparent text-slate-500 opacity-60'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                    {idx + 1}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{step.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-8 font-mono">
        Polling evaluation status every 1.5s. Your submission will never be lost.
      </p>
    </div>
  );
};