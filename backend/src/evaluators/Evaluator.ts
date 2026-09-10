import { Problem } from '../domain/Problem.js';
import { Submission } from '../domain/Submission.js';
import { CriterionFeedbackProps, EvaluatorType } from '../domain/Evaluation.js';

export interface EvaluationResult {
  evaluatorType: EvaluatorType;
  criteria: CriterionFeedbackProps[];
  overallScore: number;
  maxOverallScore: number;
  strengths: string[];
  areasToImprove: string[];
  topImprovements: string[];
}

export interface IEvaluator {
  readonly name: string;
  readonly type: EvaluatorType;
  evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult>;
}