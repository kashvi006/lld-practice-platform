import { Router, Request, Response, NextFunction } from 'express';
import { AttemptService } from '../application/AttemptService.js';
import { SubmissionService } from '../application/SubmissionService.js';
import { EvaluationService } from '../application/EvaluationService.js';
import { NotFoundError } from '../domain/errors/index.js';

const router = Router();
const attemptService = new AttemptService();
const evaluationService = new EvaluationService();
const submissionService = new SubmissionService(evaluationService);

// GET /api/attempts - Recent attempts for dashboard
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const attempts = await attemptService.getRecentAttempts(limit);
    res.json(attempts);
  } catch (err) {
    next(err);
  }
});

// GET /api/attempts/:id - Attempt details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const attempt = await attemptService.getAttemptById(id);
    res.json(attempt);
  } catch (err) {
    next(err);
  }
});

// POST /api/attempts/:id/submission - Submit LLD design
router.post('/:id/submission', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content, submissionType, idempotencyKey } = req.body;

    const result = await submissionService.submit(id, {
      submissionType,
      content,
      idempotencyKey
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/attempts/:id/evaluation - Get evaluation status and feedback
router.get('/:id/evaluation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const evaluation = await evaluationService.getEvaluationByAttemptId(id);

    if (!evaluation) {
      // Check attempt status to report informative message
      const attempt = await attemptService.getAttemptById(id);
      return res.json({
        attemptId: id,
        status: attempt.status,
        message:
          attempt.status === 'IN_PROGRESS'
            ? 'Attempt is currently in progress. Submit your design to trigger evaluation.'
            : 'Evaluation is queued or initializing...'
      });
    }

    res.json(evaluation);
  } catch (err) {
    next(err);
  }
});

// POST /api/attempts/:id/evaluation/retry - Retry failed evaluation
router.post('/:id/evaluation/retry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await evaluationService.retryEvaluation(id);
    res.json({
      message: 'Evaluation retry initiated successfully.',
      attemptId: id,
      status: 'EVALUATING'
    });
  } catch (err) {
    next(err);
  }
});

export default router;