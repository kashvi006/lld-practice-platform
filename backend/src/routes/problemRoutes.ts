import { Router, Request, Response, NextFunction } from 'express';
import { ProblemService } from '../application/ProblemService.js';
import { AttemptService } from '../application/AttemptService.js';

const router = Router();
const problemService = new ProblemService();
const attemptService = new AttemptService();

// GET /api/problems
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const problems = await problemService.getAllProblems();
    res.json(problems);
  } catch (err) {
    next(err);
  }
});

// GET /api/problems/:idOrSlug
router.get('/:idOrSlug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;
    let problem;
    try {
      problem = await problemService.getProblemById(idOrSlug);
    } catch {
      problem = await problemService.getProblemBySlug(idOrSlug);
    }
    res.json({
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      shortDescription: problem.shortDescription,
      problemStatement: problem.problemStatement,
      functionalRequirements: problem.functionalRequirements,
      constraints: problem.constraints,
      assumptionsPrompts: problem.assumptionsPrompts,
      suggestedConsiderations: problem.suggestedConsiderations,
      rubric: problem.getRubric()
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/problems/:id/attempts - Start a new practice attempt
router.post('/:id/attempts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Resolve problem ID if slug was passed
    let problemId = id;
    try {
      const p = await problemService.getProblemById(id);
      problemId = p.id;
    } catch {
      const p = await problemService.getProblemBySlug(id);
      problemId = p.id;
    }

    const attempt = await attemptService.createAttempt(problemId);
    res.status(201).json(attempt);
  } catch (err) {
    next(err);
  }
});

// GET /api/problems/:id/attempts - List attempts for this problem
router.get('/:id/attempts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let problemId = id;
    try {
      const p = await problemService.getProblemById(id);
      problemId = p.id;
    } catch {
      const p = await problemService.getProblemBySlug(id);
      problemId = p.id;
    }

    const attempts = await attemptService.getAttemptsByProblem(problemId);
    res.json(attempts);
  } catch (err) {
    next(err);
  }
});

export default router;