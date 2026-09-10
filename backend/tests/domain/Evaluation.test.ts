import { describe, it, expect } from 'vitest';
import { Evaluation } from '../../src/domain/Evaluation.js';

describe('Evaluation Domain Entity', () => {
  it('should strictly derive overall score from criteria scores', () => {
    const evaluation = new Evaluation({
      id: 'eval-1',
      attemptId: 'att-1',
      evaluatorType: 'RULE_BASED',
      status: 'EVALUATING'
    });

    const mockCriteria = [
      { criterionKey: 'c1', criterionName: 'Req', score: 8, maxScore: 10, evidence: 'e', concern: 'c', suggestion: 's', confidence: 'HIGH' as const },
      { criterionKey: 'c2', criterionName: 'Resp', score: 7, maxScore: 10, evidence: 'e', concern: 'c', suggestion: 's', confidence: 'HIGH' as const },
      { criterionKey: 'c3', criterionName: 'Enc', score: 9, maxScore: 10, evidence: 'e', concern: 'c', suggestion: 's', confidence: 'HIGH' as const }
    ];

    evaluation.completeWithResults(
      mockCriteria,
      ['Good requirements analysis'],
      ['Split coordinator class'],
      ['1. Add interfaces', '2. Address concurrency']
    );

    expect(evaluation.status).toBe('COMPLETED');
    expect(evaluation.overallScore).toBe(8 + 7 + 9); // 24
    expect(evaluation.topImprovements).toHaveLength(2);
  });

  it('should calculate percentage based on maxOverallScore', () => {
    const evaluation = new Evaluation({
      id: 'eval-2',
      attemptId: 'att-2',
      evaluatorType: 'RULE_BASED',
      status: 'COMPLETED',
      overallScore: 60,
      maxOverallScore: 80
    });

    expect(evaluation.getPercentage()).toBe(75);
  });
});