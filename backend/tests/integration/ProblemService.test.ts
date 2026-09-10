import { describe, it, expect } from 'vitest';
import { ProblemService } from '../../src/application/ProblemService.js';

describe('ProblemService Integration Tests', () => {
  const problemService = new ProblemService();

  it('should retrieve all seeded problems', async () => {
    const problems = await problemService.getAllProblems();
    expect(problems.length).toBeGreaterThanOrEqual(3);

    const slugs = problems.map(p => p.slug);
    expect(slugs).toContain('parking-lot');
    expect(slugs).toContain('elevator-system');
    expect(slugs).toContain('vending-machine');
  });

  it('should fetch parking lot details with complete requirements and rubric', async () => {
    const problem = await problemService.getProblemBySlug('parking-lot');

    expect(problem.title).toBe('Parking Lot System');
    expect(problem.difficulty).toBe('MEDIUM');
    expect(problem.functionalRequirements.length).toBeGreaterThan(0);
    expect(problem.constraints.length).toBeGreaterThan(0);
    expect(problem.getRubric()).toHaveLength(8);
  });
});