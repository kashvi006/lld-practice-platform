import { ValidationError } from './errors/index.js';

export type SubmissionType = 'TEXT' | 'CODE' | 'DIAGRAM';

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

// Future extensibility payloads (Change Test A)
export interface CodeSubmissionContent {
  language: string;
  sourceCode: string;
  entryPoint?: string;
  designNotes: string;
}

export interface DiagramSubmissionContent {
  diagramFormat: 'MERMAID' | 'PLANTUML' | 'IMAGE_URL';
  diagramData: string;
  explanation: string;
}

export type SubmissionContentPayload =
  | { type: 'TEXT'; data: TextSubmissionContent }
  | { type: 'CODE'; data: CodeSubmissionContent }
  | { type: 'DIAGRAM'; data: DiagramSubmissionContent };

export interface SubmissionProps {
  id: string;
  attemptId: string;
  submissionType: SubmissionType;
  content: TextSubmissionContent | Record<string, any>;
  idempotencyKey?: string | null;
  submittedAt?: Date;
}

export const REQUIRED_TEXT_SECTIONS: Array<{ key: keyof TextSubmissionContent; label: string; minChars: number }> = [
  { key: 'assumptions', label: 'Assumptions', minChars: 15 },
  { key: 'requirementsInterpretation', label: 'Requirements Interpretation', minChars: 15 },
  { key: 'classes', label: 'Classes & Entities', minChars: 15 },
  { key: 'responsibilities', label: 'Responsibilities & SRP', minChars: 15 },
  { key: 'relationships', label: 'Relationships & Multiplicities', minChars: 15 },
  { key: 'interfacesAbstractions', label: 'Interfaces & Abstractions', minChars: 15 },
  { key: 'designPatterns', label: 'Design Patterns Used', minChars: 15 },
  { key: 'mainApproach', label: 'Main Design Approach / Workflow', minChars: 15 },
  { key: 'edgeCases', label: 'Edge Cases & Concurrency', minChars: 15 },
  { key: 'tradeOffs', label: 'Design Trade-offs', minChars: 15 },
  { key: 'extensibility', label: 'Extensibility Considerations', minChars: 15 },
];

export class Submission {
  readonly id: string;
  readonly attemptId: string;
  readonly submissionType: SubmissionType;
  readonly content: TextSubmissionContent | Record<string, any>;
  readonly idempotencyKey: string | null;
  readonly submittedAt: Date;

  constructor(props: SubmissionProps) {
    this.id = props.id;
    this.attemptId = props.attemptId;
    this.submissionType = props.submissionType;
    this.content = props.content;
    this.idempotencyKey = props.idempotencyKey || null;
    this.submittedAt = props.submittedAt || new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.id?.trim()) throw new ValidationError('Submission ID is required');
    if (!this.attemptId?.trim()) throw new ValidationError('Attempt ID is required');

    if (this.submissionType === 'TEXT') {
      const textContent = this.content as Partial<TextSubmissionContent>;
      const fieldErrors: Record<string, string> = {};

      for (const section of REQUIRED_TEXT_SECTIONS) {
        const val = textContent[section.key];
        if (!val || typeof val !== 'string' || val.trim().length === 0) {
          fieldErrors[section.key] = `${section.label} is required.`;
        } else if (val.trim().length < section.minChars) {
          fieldErrors[section.key] = `${section.label} must be at least ${section.minChars} characters long to demonstrate substantive design rationale (currently ${val.trim().length} chars).`;
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ValidationError('Submission failed validation checks. Please complete all required sections.', fieldErrors);
      }
    }
  }

  getTextContent(): TextSubmissionContent {
    if (this.submissionType !== 'TEXT') {
      throw new Error(`Cannot retrieve text content for submission type '${this.submissionType}'`);
    }
    return this.content as TextSubmissionContent;
  }
}