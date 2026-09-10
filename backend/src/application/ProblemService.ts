import { prisma } from '../infrastructure/db/prisma.js';
import { Problem, ProblemDifficulty } from '../domain/Problem.js';
import { NotFoundError } from '../domain/errors/index.js';

export class ProblemService {
  async getAllProblems() {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { attempts: true }
        }
      }
    });

    return problems.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty as ProblemDifficulty,
      shortDescription: p.shortDescription,
      attemptCount: p._count.attempts,
      createdAt: p.createdAt
    }));
  }

  async getProblemById(id: string): Promise<Problem> {
    const p = await prisma.problem.findUnique({
      where: { id }
    });

    if (!p) {
      throw new NotFoundError('Problem', id);
    }

    return new Problem({
      id: p.id,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty as ProblemDifficulty,
      shortDescription: p.shortDescription,
      problemStatement: p.problemStatement,
      functionalRequirements: JSON.parse(p.functionalRequirements),
      constraints: JSON.parse(p.constraints),
      assumptionsPrompts: JSON.parse(p.assumptionsPrompts),
      suggestedConsiderations: JSON.parse(p.suggestedConsiderations),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    });
  }

  async getProblemBySlug(slug: string): Promise<Problem> {
    const p = await prisma.problem.findUnique({
      where: { slug }
    });

    if (!p) {
      throw new NotFoundError('Problem', slug);
    }

    return new Problem({
      id: p.id,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty as ProblemDifficulty,
      shortDescription: p.shortDescription,
      problemStatement: p.problemStatement,
      functionalRequirements: JSON.parse(p.functionalRequirements),
      constraints: JSON.parse(p.constraints),
      assumptionsPrompts: JSON.parse(p.assumptionsPrompts),
      suggestedConsiderations: JSON.parse(p.suggestedConsiderations),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    });
  }
}