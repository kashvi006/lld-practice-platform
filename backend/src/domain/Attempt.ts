import { InvalidStateTransitionError, DuplicateSubmissionError } from './errors/index.js';
import { Submission } from './Submission.js';
import { Evaluation } from './Evaluation.js';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';

export interface AttemptProps {
  id: string;
  problemId: string;
  attemptNumber: number;
  status: AttemptStatus;
  createdAt?: Date;
  updatedAt?: Date;
  submission?: Submission;
  evaluation?: Evaluation;
}

export class Attempt {
  readonly id: string;
  readonly problemId: string;
  readonly attemptNumber: number;
  private _status: AttemptStatus;
  readonly createdAt: Date;
  private _updatedAt: Date;
  private _submission?: Submission;
  private _evaluation?: Evaluation;

  constructor(props: AttemptProps) {
    this.id = props.id;
    this.problemId = props.problemId;
    this.attemptNumber = props.attemptNumber;
    this._status = props.status;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._submission = props.submission;
    this._evaluation = props.evaluation;
  }

  get status(): AttemptStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get submission(): Submission | undefined {
    return this._submission;
  }

  get evaluation(): Evaluation | undefined {
    return this._evaluation;
  }

  canSubmit(): boolean {
    return this._status === 'IN_PROGRESS' || this._status === 'FAILED';
  }

  canRetryEvaluation(): boolean {
    return this._status === 'FAILED';
  }

  /**
   * Transitions attempt to SUBMITTED state.
   * Throws DuplicateSubmissionError if already submitted or evaluation is active/completed.
   */
  markSubmitted(submission: Submission): void {
    if (this._status === 'SUBMITTED' || this._status === 'EVALUATING' || this._status === 'COMPLETED') {
      throw new DuplicateSubmissionError(this.id);
    }
    this._status = 'SUBMITTED';
    this._submission = submission;
    this._updatedAt = new Date();
  }

  markEvaluating(evaluation?: Evaluation): void {
    if (this._status !== 'SUBMITTED' && this._status !== 'FAILED') {
      throw new InvalidStateTransitionError(
        this._status,
        'EVALUATING',
        'Evaluation can only start after submission or from a failed state.'
      );
    }
    this._status = 'EVALUATING';
    if (evaluation) {
      this._evaluation = evaluation;
    }
    this._updatedAt = new Date();
  }

  markCompleted(evaluation: Evaluation): void {
    if (this._status !== 'EVALUATING') {
      throw new InvalidStateTransitionError(this._status, 'COMPLETED', 'Attempt must be in EVALUATING state.');
    }
    this._status = 'COMPLETED';
    this._evaluation = evaluation;
    this._updatedAt = new Date();
  }

  markFailed(errorMessage: string): void {
    if (this._status !== 'EVALUATING') {
      throw new InvalidStateTransitionError(this._status, 'FAILED', 'Attempt must be in EVALUATING state.');
    }
    this._status = 'FAILED';
    if (this._evaluation) {
      this._evaluation.failWithError(errorMessage);
    }
    this._updatedAt = new Date();
  }
}