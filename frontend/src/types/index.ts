export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RubricCriterionDef {
  key: string;
  name: string;
  maxScore: number;
  description: string;
  evaluationGuidance: string;
}

export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  shortDescription: string;
  attemptCount: number;
  createdAt: string;
}

export interface ProblemDetail {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  shortDescription: string;
  problemStatement: string;
  functionalRequirements: string[];
  constraints: string[];
  assumptionsPrompts: string[];
  suggestedConsiderations: string[];
  rubric: RubricCriterionDef[];
}

export interface TextSubmissionContent {
  assumptions: string;
  requirementsInterpretation: string;
  classes: string;
  responsibilities: string;
  relationships: string;
  interfacesAbstractions: string;
  designPatterns: string;
  mainApproach: string;
  edgeCases: string;
  tradeOffs: string;
  extensibility: string;
}

export interface CriterionFeedback {
  id: string;
  criterionKey: string;
  criterionName: string;
  score: number;
  maxScore: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: Confidence;
}

export interface EvaluationDetail {
  id: string;
  attemptId: string;
  attemptNumber?: number;
  problemId?: string;
  status: AttemptStatus;
  evaluatorType: 'AI' | 'RULE_BASED' | 'HUMAN';
  overallScore: number | null;
  maxOverallScore: number;
  percentage: number | null;
  strengths: string[];
  areasToImprove: string[];
  topImprovements: string[];
  errorMessage?: string | null;
  startedAt: string;
  completedAt?: string | null;
  criteria: CriterionFeedback[];
}

export interface AttemptDetail {
  id: string;
  problemId: string;
  attemptNumber: number;
  status: AttemptStatus;
  createdAt: string;
  updatedAt: string;
  problem: ProblemDetail;
  submission: {
    id: string;
    submissionType: string;
    content: TextSubmissionContent;
    submittedAt: string;
  } | null;
  evaluation: EvaluationDetail | null;
}

export interface AttemptListItem {
  id: string;
  attemptNumber: number;
  status: AttemptStatus;
  createdAt: string;
  submittedAt: string | null;
  hasSubmission: boolean;
  score: number | null;
  maxScore: number;
  evaluationStatus: string | null;
}

export interface RecentAttemptItem {
  id: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  difficulty: Difficulty;
  attemptNumber: number;
  status: AttemptStatus;
  score: number | null;
  maxScore: number;
  updatedAt: string;
}