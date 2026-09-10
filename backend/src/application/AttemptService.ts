import { prisma } from '../infrastructure/db/prisma.js';
import { NotFoundError } from '../domain/errors/index.js';
import { AttemptStatus } from '../domain/Attempt.js';

export class AttemptService {
  async createAttempt(problemId: string) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId }
    });

    if (!problem) {
      throw new NotFoundError('Problem', problemId);
    }

    // Determine the next attempt number for this problem
    const lastAttempt = await prisma.attempt.findFirst({
      where: { problemId },
      orderBy: { attemptNumber: 'desc' }
    });

    const nextAttemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

    const attempt = await prisma.attempt.create({
      data: {
        problemId,
        attemptNumber: nextAttemptNumber,
        status: 'IN_PROGRESS'
      },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true
          }
        }
      }
    });

    return attempt;
  }

  async getAttemptById(id: string) {
    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        problem: true,
        submission: true,
        evaluation: {
          include: {
            criteria: {
              orderBy: { criterionKey: 'asc' }
            }
          }
        }
      }
    });

    if (!attempt) {
      throw new NotFoundError('Attempt', id);
    }

    return {
      id: attempt.id,
      problemId: attempt.problemId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status as AttemptStatus,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
      problem: {
        id: attempt.problem.id,
        slug: attempt.problem.slug,
        title: attempt.problem.title,
        difficulty: attempt.problem.difficulty,
        shortDescription: attempt.problem.shortDescription,
        problemStatement: attempt.problem.problemStatement,
        functionalRequirements: JSON.parse(attempt.problem.functionalRequirements),
        constraints: JSON.parse(attempt.problem.constraints),
        assumptionsPrompts: JSON.parse(attempt.problem.assumptionsPrompts),
        suggestedConsiderations: JSON.parse(attempt.problem.suggestedConsiderations)
      },
      submission: attempt.submission
        ? {
            id: attempt.submission.id,
            submissionType: attempt.submission.submissionType,
            content: JSON.parse(attempt.submission.content),
            submittedAt: attempt.submission.submittedAt
          }
        : null,
      evaluation: attempt.evaluation
        ? {
            id: attempt.evaluation.id,
            status: attempt.evaluation.status,
            evaluatorType: attempt.evaluation.evaluatorType,
            overallScore: attempt.evaluation.overallScore,
            maxOverallScore: attempt.evaluation.maxOverallScore,
            percentage:
              attempt.evaluation.overallScore !== null
                ? Math.round((attempt.evaluation.overallScore / attempt.evaluation.maxOverallScore) * 100)
                : null,
            strengths: attempt.evaluation.strengths ? JSON.parse(attempt.evaluation.strengths) : [],
            areasToImprove: attempt.evaluation.areasToImprove ? JSON.parse(attempt.evaluation.areasToImprove) : [],
            topImprovements: attempt.evaluation.topImprovements ? JSON.parse(attempt.evaluation.topImprovements) : [],
            errorMessage: attempt.evaluation.errorMessage,
            startedAt: attempt.evaluation.startedAt,
            completedAt: attempt.evaluation.completedAt,
            criteria: attempt.evaluation.criteria
          }
        : null
    };
  }

  async getAttemptsByProblem(problemId: string) {
    const attempts = await prisma.attempt.findMany({
      where: { problemId },
      orderBy: { attemptNumber: 'desc' },
      include: {
        submission: {
          select: {
            id: true,
            submittedAt: true
          }
        },
        evaluation: {
          select: {
            id: true,
            status: true,
            overallScore: true,
            maxOverallScore: true,
            evaluatorType: true,
            completedAt: true
          }
        }
      }
    });

    return attempts.map(a => ({
      id: a.id,
      attemptNumber: a.attemptNumber,
      status: a.status,
      createdAt: a.createdAt,
      submittedAt: a.submission?.submittedAt || null,
      hasSubmission: Boolean(a.submission),
      score: a.evaluation?.overallScore ?? null,
      maxScore: a.evaluation?.maxOverallScore ?? 80,
      evaluationStatus: a.evaluation?.status ?? null
    }));
  }

  async getRecentAttempts(limit = 6) {
    const attempts = await prisma.attempt.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true
          }
        },
        evaluation: {
          select: {
            status: true,
            overallScore: true,
            maxOverallScore: true
          }
        }
      }
    });

    return attempts.map(a => ({
      id: a.id,
      problemId: a.problem.id,
      problemTitle: a.problem.title,
      problemSlug: a.problem.slug,
      difficulty: a.problem.difficulty,
      attemptNumber: a.attemptNumber,
      status: a.status,
      score: a.evaluation?.overallScore ?? null,
      maxScore: a.evaluation?.maxOverallScore ?? 80,
      updatedAt: a.updatedAt
    }));
  }
}