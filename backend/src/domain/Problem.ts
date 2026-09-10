import { RUBRIC_CRITERIA, RubricCriterionDefinition } from './Rubric.js';
import { ValidationError } from './errors/index.js';

export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface ProblemProps {
  id: string;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  shortDescription: string;
  problemStatement: string;
  functionalRequirements: string[];
  constraints: string[];
  assumptionsPrompts: string[];
  suggestedConsiderations: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Problem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly difficulty: ProblemDifficulty;
  readonly shortDescription: string;
  readonly problemStatement: string;
  readonly functionalRequirements: string[];
  readonly constraints: string[];
  readonly assumptionsPrompts: string[];
  readonly suggestedConsiderations: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ProblemProps) {
    this.validate(props);
    this.id = props.id;
    this.slug = props.slug;
    this.title = props.title;
    this.difficulty = props.difficulty;
    this.shortDescription = props.shortDescription;
    this.problemStatement = props.problemStatement;
    this.functionalRequirements = props.functionalRequirements;
    this.constraints = props.constraints;
    this.assumptionsPrompts = props.assumptionsPrompts;
    this.suggestedConsiderations = props.suggestedConsiderations;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  private validate(props: ProblemProps): void {
    if (!props.id?.trim()) throw new ValidationError('Problem ID is required');
    if (!props.title?.trim()) throw new ValidationError('Problem title is required');
    if (!props.problemStatement?.trim()) throw new ValidationError('Problem statement is required');
    if (!props.functionalRequirements || props.functionalRequirements.length === 0) {
      throw new ValidationError('At least one functional requirement is required');
    }
  }

  getRubric(): RubricCriterionDefinition[] {
    return RUBRIC_CRITERIA;
  }
}