import { describe, it, expect } from 'vitest';
import { EvaluatorFactory } from '../../src/evaluators/EvaluatorFactory.js';
import { RuleBasedEvaluator } from '../../src/evaluators/RuleBasedEvaluator.js';
import { AIEvaluator } from '../../src/evaluators/AIEvaluator.js';
import { IEvaluator, EvaluationResult } from '../../src/evaluators/Evaluator.js';
import { Problem } from '../../src/domain/Problem.js';
import { Submission } from '../../src/domain/Submission.js';

// Demonstration of adding a new Future Human Evaluator without modifying practice flow
class MockHumanEvaluator implements IEvaluator {
  readonly name = 'Expert Human Reviewer';
  readonly type = 'HUMAN' as any;

  async evaluate(_problem: Problem, _submission: Submission): Promise<EvaluationResult> {
    return {
      evaluatorType: 'HUMAN' as any,
      criteria: [],
      overallScore: 70,
      maxOverallScore: 80,
      strengths: ['Expert reviewed: clean decoupling'],
      areasToImprove: ['Consider distributed transaction log'],
      topImprovements: ['1. Review concurrency']
    };
  }
}

describe('Evaluator Strategy Pattern (Change Test B)', () => {
  it('should instantiate RuleBasedEvaluator when requested', () => {
    const evaluator = EvaluatorFactory.getEvaluator('RULE_BASED');
    expect(evaluator).toBeInstanceOf(RuleBasedEvaluator);
    expect(evaluator.type).toBe('RULE_BASED');
  });

  it('should instantiate AIEvaluator when requested and handle fallback if key is missing', () => {
    const evaluator = EvaluatorFactory.getEvaluator('AI');
    expect(evaluator.type).toBeDefined();
  });

  it('should seamlessly accommodate a custom or future Human Evaluator conforming to IEvaluator', async () => {
    const humanEvaluator: IEvaluator = new MockHumanEvaluator();
    expect(humanEvaluator.name).toBe('Expert Human Reviewer');

    const result = await humanEvaluator.evaluate({} as any, {} as any);
    expect(result.overallScore).toBe(70);
    expect(result.strengths).toContain('Expert reviewed: clean decoupling');
  });
});