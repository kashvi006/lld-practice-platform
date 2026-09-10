import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { api } from '../api/client.js';
import { AttemptDetail, TextSubmissionContent } from '../types/index.js';
import { DifficultyBadge } from '../components/DifficultyBadge.js';

interface SectionConfig {
  key: keyof TextSubmissionContent;
  label: string;
  minChars: number;
  placeholder: string;
  guidance: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'assumptions',
    label: '1. Assumptions',
    minChars: 15,
    placeholder: 'e.g. Assume a commercial lot with 4 levels, 50 spots each, single entry/exit gate per floor...',
    guidance: 'State operational boundaries, initial capacities, or baseline assumptions.'
  },
  {
    key: 'requirementsInterpretation',
    label: '2. Requirements Interpretation',
    minChars: 15,
    placeholder: 'e.g. The system must assign spots based on vehicle type, issue entry tickets, and compute fees on exit...',
    guidance: 'Summarize how you interpret the core problem and user journeys.'
  },
  {
    key: 'classes',
    label: '3. Classes & Entities',
    minChars: 15,
    placeholder: 'e.g. ParkingLot, Floor, ParkingSpot, CompactSpot, LargeSpot, Ticket, Vehicle, Car, Bike, FeeService...',
    guidance: 'List all major domain classes, value objects, and coordinator services.'
  },
  {
    key: 'responsibilities',
    label: '4. Responsibilities & Single Responsibility Principle (SRP)',
    minChars: 15,
    placeholder: 'e.g. ParkingLot coordinates floors; ParkingSpot encapsulates occupancy; FeeCalculationStrategy handles pricing...',
    guidance: 'Explain what each class owns and ensure coordinator classes do not handle everything.'
  },
  {
    key: 'relationships',
    label: '5. Relationships & Multiplicities',
    minChars: 15,
    placeholder: 'e.g. ParkingLot 1 ──* Floor, Floor 1 ──* ParkingSpot (composition), Ticket references ParkingSpot...',
    guidance: 'Specify composition, aggregation, associations, and inheritance hierarchies.'
  },
  {
    key: 'interfacesAbstractions',
    label: '6. Interfaces & Abstractions',
    minChars: 15,
    placeholder: 'e.g. ISpotAllocationStrategy { findSpot(vehicleType): Spot }, IPricingStrategy { computeFee(duration): number }...',
    guidance: 'Highlight contracts and interfaces designed for loose coupling.'
  },
  {
    key: 'designPatterns',
    label: '7. Design Patterns Used',
    minChars: 15,
    placeholder: 'e.g. Strategy Pattern for spot allocation and fee calculation; Factory Pattern for vehicle instantiation...',
    guidance: 'Mention standard GoF patterns used to handle actual domain variability.'
  },
  {
    key: 'mainApproach',
    label: '8. Main Design Approach & Workflow',
    minChars: 15,
    placeholder: 'e.g. When a vehicle enters, EntrancePanel queries AllocationStrategy, creates Ticket, sets Spot to occupied...',
    guidance: 'Walk through the step-by-step lifecycle for primary user scenarios.'
  },
  {
    key: 'edgeCases',
    label: '9. Edge Cases & Concurrency',
    minChars: 15,
    placeholder: 'e.g. Two cars entering simultaneously targeting the last spot: addressed with synchronized spot locking...',
    guidance: 'Describe handling for capacity overflow, race conditions, and failure states.'
  },
  {
    key: 'tradeOffs',
    label: '10. Design Trade-offs',
    minChars: 15,
    placeholder: 'e.g. In-memory spot indexing chosen for sub-millisecond lookups over querying DB on every check...',
    guidance: 'Justify architectural decisions: what was prioritized (speed, simplicity, flexibility) and what was sacrificed?'
  },
  {
    key: 'extensibility',
    label: '11. Extensibility Considerations & OCP',
    minChars: 15,
    placeholder: 'e.g. Adding an Electric Vehicle requires adding an EVSpot class and EVChargingFeeStrategy without modifying ParkingLot...',
    guidance: 'Demonstrate how a new requirement or vehicle type can be plugged in without changing existing code.'
  }
];

export const PracticePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [savedLocally, setSavedLocally] = useState(false);

  const [formData, setFormData] = useState<TextSubmissionContent>({
    assumptions: '',
    requirementsInterpretation: '',
    classes: '',
    responsibilities: '',
    relationships: '',
    interfacesAbstractions: '',
    designPatterns: '',
    mainApproach: '',
    edgeCases: '',
    tradeOffs: '',
    extensibility: ''
  });

  const storageKey = `lld_draft_${id}`;

  // Load attempt and draft
  useEffect(() => {
    async function loadAttempt() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.getAttempt(id);
        setAttempt(data);

        // If already submitted or evaluated, redirect
        if (data.status === 'SUBMITTED' || data.status === 'EVALUATING' || data.status === 'COMPLETED') {
          navigate(`/attempts/${id}/evaluation`);
          return;
        }

        // Restore draft from localStorage if available
        const savedDraft = localStorage.getItem(storageKey);
        if (savedDraft) {
          try {
            setFormData(JSON.parse(savedDraft));
            setSavedLocally(true);
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        alert(`Failed to load attempt: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadAttempt();
  }, [id, navigate, storageKey]);

  // Handle field updates with autosave
  const handleChange = (key: keyof TextSubmissionContent, value: string) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);

    // clear validation error for this field
    if (validationErrors[key]) {
      const nextErrors = { ...validationErrors };
      delete nextErrors[key];
      setValidationErrors(nextErrors);
    }

    // Save draft
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setSavedLocally(true);
  };

  // Pre-submission client-side validation check
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    for (const s of SECTIONS) {
      const val = formData[s.key]?.trim() || '';
      if (!val) {
        errors[s.key] = `${s.label} is required.`;
      } else if (val.length < s.minChars) {
        errors[s.key] = `Must be at least ${s.minChars} characters (currently ${val.length}).`;
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fill out all 11 required sections with sufficient detail before submitting.');
      return;
    }

    if (!confirm('Are you ready to submit your design for evaluation?')) {
      return;
    }

    try {
      setSubmitting(true);
      await api.submitDesign(id!, formData);
      localStorage.removeItem(storageKey);
      navigate(`/attempts/${id}/evaluation`);
    } catch (err: any) {
      if (err.details) {
        setValidationErrors(err.details);
      }
      alert(`Submission error: ${err.message}`);
      setSubmitting(false);
    }
  };

  // Calculate completed count
  const completedCount = SECTIONS.filter(
    s => (formData[s.key]?.trim().length || 0) >= s.minChars
  ).length;

  if (loading || !attempt) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm">Preparing practice environment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {attempt.problem.title}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
              Attempt #{attempt.attemptNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowRequirements(!showRequirements)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>{showRequirements ? 'Hide Requirements' : 'View Requirements'}</span>
          </button>

          {savedLocally && (
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Draft Autosaved</span>
            </span>
          )}
        </div>
      </div>

      {/* Collapsible Requirements Reference Panel */}
      {showRequirements && (
        <div className="rounded-2xl border border-sky-500/30 bg-slate-900/90 p-6 space-y-4 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Problem Requirements Quick Reference</h3>
            <button
              onClick={() => setShowRequirements(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div>
              <p className="font-bold text-sky-400 mb-1.5">Functional Scope:</p>
              <ul className="space-y-1 list-disc pl-4 text-slate-300">
                {attempt.problem.functionalRequirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-amber-400 mb-1.5">Constraints:</p>
              <ul className="space-y-1 list-disc pl-4 text-slate-300">
                {attempt.problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Guidance Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-white uppercase tracking-wider">
            Structured LLD Submission Form
          </p>
          <p className="text-xs text-slate-400">
            Complete the 11 architectural dimensions below. Concrete details enable the evaluator to provide specific evidence and actionable advice.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300 rounded-full"
              style={{ width: `${(completedCount / SECTIONS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">
            {completedCount} / {SECTIONS.length} completed
          </span>
        </div>
      </div>

      {/* Structured Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {SECTIONS.map((section, idx) => {
          const value = formData[section.key];
          const charCount = value?.trim().length || 0;
          const isValid = charCount >= section.minChars;
          const hasError = Boolean(validationErrors[section.key]);

          return (
            <div
              key={section.key}
              className={`rounded-2xl border transition-all p-5 sm:p-6 bg-slate-900/40 ${
                hasError
                  ? 'border-rose-500/60 bg-rose-500/5'
                  : isValid
                  ? 'border-slate-800 focus-within:border-sky-500/50'
                  : 'border-slate-800/80 focus-within:border-sky-500/50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                  <span>{section.label}</span>
                  {isValid && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </label>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs ${
                      charCount >= section.minChars ? 'text-slate-400' : 'text-amber-400'
                    }`}
                  >
                    {charCount} chars {charCount < section.minChars ? `(min ${section.minChars})` : ''}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-3">{section.guidance}</p>

              <textarea
                value={value}
                onChange={e => handleChange(section.key, e.target.value)}
                placeholder={section.placeholder}
                rows={4}
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors font-mono leading-relaxed resize-y"
              />

              {hasError && (
                <p className="mt-2 text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{validationErrors[section.key]}</span>
                </p>
              )}
            </div>
          );
        })}

        {/* Submit Action Bar */}
        <div className="sticky bottom-4 z-20 p-4 rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white">
              {completedCount === SECTIONS.length
                ? 'All 11 sections ready for evaluation!'
                : `${SECTIONS.length - completedCount} sections left to complete.`}
            </p>
            <p className="text-[11px] text-slate-400">
              Submissions are permanently persisted before evaluation starts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || completedCount < SECTIONS.length}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Starting Evaluation...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Design for Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};