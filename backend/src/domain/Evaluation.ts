import { ValidationError } from './errors/index.js';
import { TOTAL_MAX_SCORE } from './Rubric.js';

export type EvaluationStatus = 'EVALUATING' | 'COMPLETED' | 'FAILED';
export type EvaluatorType = 'AI' | 'RULE_BASED' | 'HUMAN';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CriterionFeedbackProps {
  id?: string;
  criterionKey: string;
  criterionName: string;
  score: number;
  maxScore: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: ConfidenceLevel;
}

export interface EvaluationProps {
  id: string;
  attemptId: string;
  evaluatorType: EvaluatorType;
  status: EvaluationStatus;
  overallScore?: number | null;
  maxOverallScore?: number;
  strengths?: string[];
  areasToImprove?: string[];
  topImprovements?: string[];
  errorMessage?: string | null;
  startedAt?: Date;
  completedAt?: Date | null;
  criteria?: CriterionFeedbackProps[];
}

export class Evaluation {
  readonly id: string;
  readonly attemptId: string;
  readonly evaluatorType: EvaluatorType;
  private _status: EvaluationStatus;
  private _overallScore: number | null;
  readonly maxOverallScore: number;
  private _strengths: string[];
  private _areasToImprove: string[];
  private _topImprovements: string[];
  private _errorMessage: string | null;
  readonly startedAt: Date;
  private _completedAt: Date | null;
  private _criteria: CriterionFeedbackProps[];

  constructor(props: EvaluationProps) {
    this.id = props.id;
    this.attemptId = props.attemptId;
    this.evaluatorType = props.evaluatorType;
    this._status = props.status;
    this.maxOverallScore = props.maxOverallScore ?? TOTAL_MAX_SCORE;
    this._strengths = props.strengths || [];
    this._areasToImprove = props.areasToImprove || [];
    this._topImprovements = props.topImprovements || [];
    this._errorMessage = props.errorMessage || null;
    this.startedAt = props.startedAt || new Date();
    this._completedAt = props.completedAt || null;
    this._criteria = props.criteria || [];

    // Enforce derived score rule if criteria are present
    if (this._criteria.length > 0) {
      this._overallScore = this.computeDerivedScore(this._criteria);
    } else {
      this._overallScore = props.overallScore ?? null;
    }
  }

  get status(): EvaluationStatus {
    return this._status;
  }

  get overallScore(): number | null {
    return this._overallScore;
  }

  get strengths(): string[] {
    return [...this._strengths];
  }

  get areasToImprove(): string[] {
    return [...this._areasToImprove];
  }

  get topImprovements(): string[] {
    return [...this._topImprovements];
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get criteria(): CriterionFeedbackProps[] {
    return [...this._criteria];
  }

  /**
   * Strictly derives overall score from the sum of criterion scores.
   * Prevents arbitrary or hallucinated scores.
   */
  private computeDerivedScore(criteria: CriterionFeedbackProps[]): number {
    return criteria.reduce((sum, item) => sum + Math.max(0, Math.min(item.maxScore, item.score)), 0);
  }

  completeWithResults(
    criteria: CriterionFeedbackProps[],
    strengths: string[],
    areasToImprove: string[],
    topImprovements: string[]
  ): void {
    if (criteria.length === 0) {
      throw new ValidationError('Cannot complete evaluation without rubric criteria results');
    }
    this._criteria = criteria;
    this._overallScore = this.computeDerivedScore(criteria);
    this._strengths = strengths;
    this._areasToImprove = areasToImprove;
    this._topImprovements = topImprovements.slice(0, 3); // top 3 actionable items
    this._status = 'COMPLETED';
    this._errorMessage = null;
    this._completedAt = new Date();
  }

  failWithError(message: string): void {
    this._status = 'FAILED';
    this._errorMessage = message;
    this._completedAt = new Date();
  }

  getPercentage(): number | null {
    if (this._overallScore === null || this.maxOverallScore <= 0) return null;
    return Math.round((this._overallScore / this.maxOverallScore) * 100);
  }
}