import { describe, it, expect } from 'vitest';
import { AIEvaluator } from '../../src/evaluators/AIEvaluator.js';
import { EvaluatorError } from '../../src/domain/errors/index.js';

describe('AIEvaluator Response Parser & Validator', () => {
  const aiEvaluator = new AIEvaluator('dummy-test-key');

  it('should parse valid AI JSON response and enforce derived score', () => {
    const validAiResponse = JSON.stringify({
      criteria: [
        { criterionKey: 'requirement_understanding', criterionName: 'Requirement Understanding', score: 8, evidence: 'Ev 1', concern: 'Co 1', suggestion: 'Su 1', confidence: 'HIGH' },
        { criterionKey: 'class_responsibilities', criterionName: 'Class Responsibilities & SRP', score: 7, evidence: 'Ev 2', concern: 'Co 2', suggestion: 'Su 2', confidence: 'HIGH' },
        { criterionKey: 'encapsulation_interfaces', criterionName: 'Encapsulation & Interface Design', score: 9, evidence: 'Ev 3', concern: 'Co 3', suggestion: 'Su 3', confidence: 'HIGH' },
        { criterionKey: 'coupling_cohesion', criterionName: 'Coupling & Cohesion', score: 8, evidence: 'Ev 4', concern: 'Co 4', suggestion: 'Su 4', confidence: 'HIGH' },
        { criterionKey: 'abstraction_patterns', criterionName: 'Abstraction & Design Patterns', score: 8, evidence: 'Ev 5', concern: 'Co 5', suggestion: 'Su 5', confidence: 'HIGH' },
        { criterionKey: 'extensibility', criterionName: 'Extensibility & OCP', score: 7, evidence: 'Ev 6', concern: 'Co 6', suggestion: 'Su 6', confidence: 'HIGH' },
        { criterionKey: 'edge_cases', criterionName: 'Edge Cases & Concurrency', score: 8, evidence: 'Ev 7', concern: 'Co 7', suggestion: 'Su 7', confidence: 'HIGH' },
        { criterionKey: 'explanation_quality', criterionName: 'Quality of Explanation & Trade-offs', score: 9, evidence: 'Ev 8', concern: 'Co 8', suggestion: 'Su 8', confidence: 'HIGH' }
      ],
      strengths: ['Strong design patterns', 'Clear requirements'],
      areasToImprove: ['Concurrency handling', 'Database indexing'],
      topImprovements: ['1. Add locks', '2. Extract strategy', '3. Add metrics']
    });

    const result = aiEvaluator.parseAndValidateResponse(validAiResponse);

    expect(result.evaluatorType).toBe('AI');
    expect(result.criteria).toHaveLength(8);
    // 8 + 7 + 9 + 8 + 8 + 7 + 8 + 9 = 64
    expect(result.overallScore).toBe(64);
    expect(result.maxOverallScore).toBe(80);
    expect(result.topImprovements).toHaveLength(3);
  });

  it('should throw EvaluatorError if AI returns malformed or non-JSON response', () => {
    const invalidText = 'Here is your score: 80/100, good job!';

    expect(() => {
      aiEvaluator.parseAndValidateResponse(invalidText);
    }).toThrow(EvaluatorError);
  });

  it('should throw EvaluatorError if AI response fails schema validation', () => {
    const incompleteJson = JSON.stringify({
      criteria: 'not an array'
    });

    expect(() => {
      aiEvaluator.parseAndValidateResponse(incompleteJson);
    }).toThrow(EvaluatorError);
  });
});