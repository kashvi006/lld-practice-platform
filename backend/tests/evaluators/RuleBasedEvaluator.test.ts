import { describe, it, expect } from 'vitest';
import { RuleBasedEvaluator } from '../../src/evaluators/RuleBasedEvaluator.js';
import { Problem } from '../../src/domain/Problem.js';
import { Submission } from '../../src/domain/Submission.js';

describe('RuleBasedEvaluator', () => {
  const problem = new Problem({
    id: 'p-parking',
    slug: 'parking-lot',
    title: 'Parking Lot System',
    difficulty: 'MEDIUM',
    shortDescription: 'Multi-floor parking lot',
    problemStatement: 'Design a multi-floor parking lot supporting cars and bikes.',
    functionalRequirements: ['Support car and bike spots', 'Ticket generation'],
    constraints: ['Single vehicle per spot'],
    assumptionsPrompts: ['Fixed floors'],
    suggestedConsiderations: ['Strategy pattern']
  });

  const submission = new Submission({
    id: 'sub-test',
    attemptId: 'att-test',
    submissionType: 'TEXT',
    content: {
      assumptions: 'Assume 5 floors, 20 spots per floor, standard operating times.',
      requirementsInterpretation: 'Must support vehicle types (Motorcycle, Car, Truck) with dynamic spot assignment and ticketing.',
      classes: 'ParkingLot, Floor, Spot, CompactSpot, LargeSpot, Ticket, Vehicle, VehicleFactory.',
      responsibilities: 'ParkingLot manages floors. Spot tracks state. Ticket holds timestamps and spot references.',
      relationships: 'ParkingLot contains Floors. Floor contains Spots. Ticket references Spot via composition.',
      interfacesAbstractions: 'ISpotAllocationStrategy for nearest spot allocation, IPricingStrategy for hourly fees.',
      designPatterns: 'Strategy Pattern for fee calculation and spot assignment. Factory for vehicle creation.',
      mainApproach: 'On vehicle arrival, find available spot using strategy, assign ticket, mark spot occupied.',
      edgeCases: 'Handles lot full scenario, concurrent spot booking with thread locks, and payment timeouts.',
      tradeOffs: 'In-memory locks chosen for low latency over heavy database distributed locks.',
      extensibility: 'New vehicle types can be added by implementing Vehicle interface and registering new spot type.'
    }
  });

  it('should evaluate all 8 rubric criteria and return explainable feedback', async () => {
    const evaluator = new RuleBasedEvaluator();
    const result = await evaluator.evaluate(problem, submission);

    expect(result.evaluatorType).toBe('RULE_BASED');
    expect(result.criteria).toHaveLength(8);

    // Verify all 8 criteria have concrete evidence, concerns, suggestions, confidence
    for (const c of result.criteria) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(10);
      expect(c.evidence).toBeTruthy();
      expect(c.concern).toBeTruthy();
      expect(c.suggestion).toBeTruthy();
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(c.confidence);
    }

    // Verify derived overall score rule: sum of criteria
    const sum = result.criteria.reduce((acc, c) => acc + c.score, 0);
    expect(result.overallScore).toBe(sum);

    // Verify strengths and top 3 improvements
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.topImprovements).toHaveLength(3);
  });
});