import { describe, it, expect } from 'vitest';
import { ProblemService } from '../../src/application/ProblemService.js';
import { AttemptService } from '../../src/application/AttemptService.js';
import { SubmissionService } from '../../src/application/SubmissionService.js';
import { DuplicateSubmissionError } from '../../src/domain/errors/index.js';

describe('Duplicate Submission Prevention', () => {
  const problemService = new ProblemService();
  const attemptService = new AttemptService();
  const submissionService = new SubmissionService();

  const validContent = {
    assumptions: 'Valid assumptions text for testing minimum chars.',
    requirementsInterpretation: 'Valid requirements text for testing minimum chars.',
    classes: 'Valid classes text for testing minimum chars.',
    responsibilities: 'Valid responsibilities text for testing minimum chars.',
    relationships: 'Valid relationships text for testing minimum chars.',
    interfacesAbstractions: 'Valid interfaces text for testing minimum chars.',
    designPatterns: 'Valid patterns text for testing minimum chars.',
    mainApproach: 'Valid approach text for testing minimum chars.',
    edgeCases: 'Valid edge cases text for testing minimum chars.',
    tradeOffs: 'Valid trade-offs text for testing minimum chars.',
    extensibility: 'Valid extensibility text for testing minimum chars.'
  };

  it('should reject a second submission on an already submitted attempt', async () => {
    const problem = await problemService.getProblemBySlug('vending-machine');
    const attempt = await attemptService.createAttempt(problem.id);

    // First submission succeeds
    await submissionService.submit(attempt.id, {
      submissionType: 'TEXT',
      content: validContent
    });

    // Duplicate submission attempt must throw DuplicateSubmissionError
    await expect(
      submissionService.submit(attempt.id, {
        submissionType: 'TEXT',
        content: validContent
      })
    ).rejects.toThrow(DuplicateSubmissionError);
  });
});