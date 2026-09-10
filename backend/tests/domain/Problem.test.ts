import { describe, it, expect } from 'vitest';
import { Problem } from '../../src/domain/Problem.js';
import { ValidationError } from '../../src/domain/errors/index.js';

describe('Problem Domain Entity', () => {
  it('should successfully create a valid Problem entity', () => {
    const problem = new Problem({
      id: 'p-1',
      slug: 'parking-lot',
      title: 'Parking Lot System',
      difficulty: 'MEDIUM',
      shortDescription: 'Design a parking lot.',
      problemStatement: 'Design a multi-floor parking lot with spot allocation.',
      functionalRequirements: ['Support cars and bikes', 'Ticket generation'],
      constraints: ['Single car per spot'],
      assumptionsPrompts: ['Fixed floors'],
      suggestedConsiderations: ['Strategy pattern for fee calculation']
    });

    expect(problem.id).toBe('p-1');
    expect(problem.title).toBe('Parking Lot System');
    expect(problem.difficulty).toBe('MEDIUM');
    expect(problem.getRubric()).toHaveLength(8);
  });

  it('should throw ValidationError if required fields are missing', () => {
    expect(() => {
      new Problem({
        id: '',
        slug: 'parking-lot',
        title: 'Parking Lot',
        difficulty: 'MEDIUM',
        shortDescription: 'Desc',
        problemStatement: 'Statement',
        functionalRequirements: ['Req 1'],
        constraints: [],
        assumptionsPrompts: [],
        suggestedConsiderations: []
      });
    }).toThrow(ValidationError);
  });
});