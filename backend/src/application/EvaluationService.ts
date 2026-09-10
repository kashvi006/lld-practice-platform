import { prisma } from '../infrastructure/db/prisma.js';
import { EvaluatorFactory } from '../evaluators/EvaluatorFactory.js';
import { NotFoundError, InvalidStateTransitionError } from '../domain/errors/index.js';
import { Problem } from '../domain/Problem.js';
import { Submission } from '../domain/Submission.js';
import { Evaluation, EvaluationStatus } from '../domain/Evaluation.js';

export class EvaluationService {
  async runEvaluation(attemptId: string): Promise<void> {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        problem: true,
        submission: true,
        evaluation: true
      }
    });

    if (!attempt) {
      throw new NotFoundError('Attempt', attemptId);
    }

    if (!attempt.submission) {
      throw new Error(`Cannot evaluate attempt '${attemptId}' because no submission exists.`);
    }

    // Set status to EVALUATING
    await prisma.$transaction([
      prisma.attempt.update({
        where: { id: attemptId },
        data: { status: 'EVALUATING' }
      }),
      prisma.evaluation.upsert({
        where: { attemptId },
        create: {
          attemptId,
          evaluatorType: process.env.GEMINI_API_KEY ? 'AI' : 'RULE_BASED',
          status: 'EVALUATING',
          startedAt: new Date()
        },
        update: {
          status: 'EVALUATING',
          errorMessage: null,
          startedAt: new Date()
        }
      })
    ]);

    try {
      // Reconstruct domain Problem
      const problem = new Problem({
        id: attempt.problem.id,
        slug: attempt.problem.slug,
        title: attempt.problem.title,
        difficulty: attempt.problem.difficulty as any,
        shortDescription: attempt.problem.shortDescription,
        problemStatement: attempt.problem.problemStatement,
        functionalRequirements: JSON.parse(attempt.problem.functionalRequirements),
        constraints: JSON.parse(attempt.problem.constraints),
        assumptionsPrompts: JSON.parse(attempt.problem.assumptionsPrompts),
        suggestedConsiderations: JSON.parse(attempt.problem.suggestedConsiderations)
      });

      // Reconstruct domain Submission
      const submission = new Submission({
        id: attempt.submission.id,
        attemptId: attempt.submission.attemptId,
        submissionType: attempt.submission.submissionType as any,
        content: JSON.parse(attempt.submission.content)
      });

      // Select evaluator via Evaluator Strategy Factory
      const evaluator = EvaluatorFactory.getEvaluator();
      const evaluationResult = await evaluator.evaluate(problem, submission);

      // Save evaluation and criterion feedback in a transaction
      await prisma.$transaction(async tx => {
        // Delete previous criteria if retrying
        const existingEval = await tx.evaluation.findUnique({ where: { attemptId } });
        if (existingEval) {
          await tx.criterionFeedback.deleteMany({ where: { evaluationId: existingEval.id } });
        }

        const evaluationRecord = await tx.evaluation.upsert({
          where: { attemptId },
          create: {
            attemptId,
            evaluatorType: evaluationResult.evaluatorType,
            status: 'COMPLETED',
            overallScore: evaluationResult.overallScore,
            maxOverallScore: evaluationResult.maxOverallScore,
            strengths: JSON.stringify(evaluationResult.strengths),
            areasToImprove: JSON.stringify(evaluationResult.areasToImprove),
            topImprovements: JSON.stringify(evaluationResult.topImprovements),
            completedAt: new Date()
          },
          update: {
            evaluatorType: evaluationResult.evaluatorType,
            status: 'COMPLETED',
            overallScore: evaluationResult.overallScore,
            maxOverallScore: evaluationResult.maxOverallScore,
            strengths: JSON.stringify(evaluationResult.strengths),
            areasToImprove: JSON.stringify(evaluationResult.areasToImprove),
            topImprovements: JSON.stringify(evaluationResult.topImprovements),
            errorMessage: null,
            completedAt: new Date()
          }
        });

        for (const c of evaluationResult.criteria) {
          await tx.criterionFeedback.create({
            data: {
              evaluationId: evaluationRecord.id,
              criterionKey: c.criterionKey,
              criterionName: c.criterionName,
              score: c.score,
              maxScore: c.maxScore,
              evidence: c.evidence,
              concern: c.concern,
              suggestion: c.suggestion,
              confidence: c.confidence
            }
          });
        }

        await tx.attempt.update({
          where: { id: attemptId },
          data: { status: 'COMPLETED' }
        });
      });
    } catch (err: any) {
      console.error(`Evaluation failed for attempt ${attemptId}:`, err);
      const errorMessage = err.message || 'An unexpected error occurred during evaluation.';

      await prisma.$transaction([
        prisma.evaluation.upsert({
          where: { attemptId },
          create: {
            attemptId,
            evaluatorType: 'RULE_BASED',
            status: 'FAILED',
            errorMessage
          },
          update: {
            status: 'FAILED',
            errorMessage
          }
        }),
        prisma.attempt.update({
          where: { id: attemptId },
          data: { status: 'FAILED' }
        })
      ]);
    }
  }

  async retryEvaluation(attemptId: string): Promise<void> {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { evaluation: true }
    });

    if (!attempt) {
      throw new NotFoundError('Attempt', attemptId);
    }

    if (attempt.status !== 'FAILED') {
      throw new InvalidStateTransitionError(
        attempt.status,
        'EVALUATING',
        'Only failed evaluations can be retried.'
      );
    }

    // Trigger evaluation asynchronously
    setImmediate(() => {
      this.runEvaluation(attemptId).catch(err => {
        console.error(`Error in async retryEvaluation for attempt ${attemptId}:`, err);
      });
    });
  }

  async getEvaluationByAttemptId(attemptId: string) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { attemptId },
      include: {
        criteria: {
          orderBy: { criterionKey: 'asc' }
        },
        attempt: {
          select: {
            id: true,
            problemId: true,
            attemptNumber: true,
            status: true
          }
        }
      }
    });

    if (!evaluation) {
      return null;
    }

    return {
      id: evaluation.id,
      attemptId: evaluation.attemptId,
      attemptNumber: evaluation.attempt.attemptNumber,
      problemId: evaluation.attempt.problemId,
      status: evaluation.status as EvaluationStatus,
      evaluatorType: evaluation.evaluatorType,
      overallScore: evaluation.overallScore,
      maxOverallScore: evaluation.maxOverallScore,
      percentage: evaluation.overallScore !== null ? Math.round((evaluation.overallScore / evaluation.maxOverallScore) * 100) : null,
      strengths: evaluation.strengths ? JSON.parse(evaluation.strengths) : [],
      areasToImprove: evaluation.areasToImprove ? JSON.parse(evaluation.areasToImprove) : [],
      topImprovements: evaluation.topImprovements ? JSON.parse(evaluation.topImprovements) : [],
      errorMessage: evaluation.errorMessage,
      startedAt: evaluation.startedAt,
      completedAt: evaluation.completedAt,
      criteria: evaluation.criteria.map(c => ({
        id: c.id,
        criterionKey: c.criterionKey,
        criterionName: c.criterionName,
        score: c.score,
        maxScore: c.maxScore,
        evidence: c.evidence,
        concern: c.concern,
        suggestion: c.suggestion,
        confidence: c.confidence
      }))
    };
  }
}