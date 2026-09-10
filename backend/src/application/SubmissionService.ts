import { prisma } from '../infrastructure/db/prisma.js';
import { NotFoundError, DuplicateSubmissionError } from '../domain/errors/index.js';
import { Submission, SubmissionType, TextSubmissionContent } from '../domain/Submission.js';
import { EvaluationService } from './EvaluationService.js';

export interface SubmitInput {
  submissionType?: SubmissionType;
  content: TextSubmissionContent | Record<string, any>;
  idempotencyKey?: string;
}

export class SubmissionService {
  constructor(private readonly evaluationService: EvaluationService = new EvaluationService()) {}

  async submit(attemptId: string, input: SubmitInput) {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        submission: true,
        evaluation: true
      }
    });

    if (!attempt) {
      throw new NotFoundError('Attempt', attemptId);
    }

    // Check duplicate submission rules
    if (attempt.status === 'SUBMITTED' || attempt.status === 'EVALUATING' || attempt.status === 'COMPLETED') {
      throw new DuplicateSubmissionError(attemptId);
    }

    const submissionType: SubmissionType = input.submissionType || 'TEXT';

    // Domain validation: instantiate domain Submission which enforces all business rules
    const domainSubmission = new Submission({
      id: attempt.submission?.id || 'temp-id',
      attemptId,
      submissionType,
      content: input.content,
      idempotencyKey: input.idempotencyKey
    });

    // Persist submission and transition status to SUBMITTED inside transaction
    const savedSubmission = await prisma.$transaction(async tx => {
      const sub = await tx.submission.upsert({
        where: { attemptId },
        create: {
          attemptId,
          submissionType,
          content: JSON.stringify(domainSubmission.content),
          idempotencyKey: input.idempotencyKey || null
        },
        update: {
          submissionType,
          content: JSON.stringify(domainSubmission.content),
          idempotencyKey: input.idempotencyKey || null,
          submittedAt: new Date()
        }
      });

      await tx.attempt.update({
        where: { id: attemptId },
        data: { status: 'SUBMITTED' }
      });

      return sub;
    });

    // Trigger evaluation asynchronously in the background
    setImmediate(() => {
      this.evaluationService.runEvaluation(attemptId).catch(err => {
        console.error(`Background evaluation failed for attempt ${attemptId}:`, err);
      });
    });

    return {
      id: savedSubmission.id,
      attemptId: savedSubmission.attemptId,
      submissionType: savedSubmission.submissionType,
      content: JSON.parse(savedSubmission.content),
      submittedAt: savedSubmission.submittedAt,
      status: 'SUBMITTED'
    };
  }
}