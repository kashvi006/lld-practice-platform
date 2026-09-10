import { describe, it, expect } from 'vitest';
import { Attempt } from '../../src/domain/Attempt.js';
import { Submission } from '../../src/domain/Submission.js';
import { Evaluation } from '../../src/domain/Evaluation.js';
import { DuplicateSubmissionError, InvalidStateTransitionError } from '../../src/domain/errors/index.js';

describe('Attempt Domain Entity & State Machine', () => {
  const dummySubmission = new Submission({
    id: 'sub-1',
    attemptId: 'att-1',
    submissionType: 'TEXT',
    content: {
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
    }
  });

  it('should initialize with IN_PROGRESS status and allow submission', () => {
    const attempt = new Attempt({
      id: 'att-1',
      problemId: 'p-1',
      attemptNumber: 1,
      status: 'IN_PROGRESS'
    });

    expect(attempt.status).toBe('IN_PROGRESS');
    expect(attempt.canSubmit()).toBe(true);

    attempt.markSubmitted(dummySubmission);
    expect(attempt.status).toBe('SUBMITTED');
    expect(attempt.canSubmit()).toBe(false);
  });

  it('should prevent duplicate submission on already submitted attempt', () => {
    const attempt = new Attempt({
      id: 'att-1',
      problemId: 'p-1',
      attemptNumber: 1,
      status: 'SUBMITTED'
    });

    expect(() => {
      attempt.markSubmitted(dummySubmission);
    }).toThrow(DuplicateSubmissionError);
  });

  it('should follow lifecycle: SUBMITTED -> EVALUATING -> COMPLETED', () => {
    const attempt = new Attempt({
      id: 'att-1',
      problemId: 'p-1',
      attemptNumber: 1,
      status: 'SUBMITTED'
    });

    attempt.markEvaluating();
    expect(attempt.status).toBe('EVALUATING');

    const evaluation = new Evaluation({
      id: 'eval-1',
      attemptId: 'att-1',
      evaluatorType: 'RULE_BASED',
      status: 'COMPLETED',
      overallScore: 60
    });

    attempt.markCompleted(evaluation);
    expect(attempt.status).toBe('COMPLETED');
  });

  it('should handle evaluation failure and allow retry', () => {
    const attempt = new Attempt({
      id: 'att-1',
      problemId: 'p-1',
      attemptNumber: 1,
      status: 'EVALUATING'
    });

    attempt.markFailed('AI API timeout');
    expect(attempt.status).toBe('FAILED');
    expect(attempt.canRetryEvaluation()).toBe(true);

    attempt.markEvaluating();
    expect(attempt.status).toBe('EVALUATING');
  });

  it('should reject invalid state transitions', () => {
    const attempt = new Attempt({
      id: 'att-1',
      problemId: 'p-1',
      attemptNumber: 1,
      status: 'IN_PROGRESS'
    });

    expect(() => {
      attempt.markCompleted(new Evaluation({
        id: 'eval-1',
        attemptId: 'att-1',
        evaluatorType: 'RULE_BASED',
        status: 'COMPLETED'
      }));
    }).toThrow(InvalidStateTransitionError);
  });
});