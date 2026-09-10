import { describe, it, expect } from 'vitest';
import { ProblemService } from '../../src/application/ProblemService.js';
import { AttemptService } from '../../src/application/AttemptService.js';
import { SubmissionService } from '../../src/application/SubmissionService.js';
import { EvaluationService } from '../../src/application/EvaluationService.js';
import { TextSubmissionContent } from '../../src/domain/Submission.js';

describe('Attempt Lifecycle Integration Tests', () => {
  const problemService = new ProblemService();
  const attemptService = new AttemptService();
  const evaluationService = new EvaluationService();
  const submissionService = new SubmissionService(evaluationService);

  const sampleSubmission: TextSubmissionContent = {
    assumptions: 'Assume 3 floors with 50 spots each, 2 entry gates, and hourly pricing.',
    requirementsInterpretation: 'Support multiple vehicle types with spot allocation, ticketing, and exit billing.',
    classes: 'ParkingLot, Floor, ParkingSpot, Ticket, Vehicle, VehicleFactory, FeeCalculator.',
    responsibilities: 'ParkingLot coordinates floor spots. Spot tracks status. Ticket stores entry timestamp.',
    relationships: 'ParkingLot has Floors. Floor has Spots. Ticket references Spot.',
    interfacesAbstractions: 'ISpotAllocationStrategy for spot finding, IPaymentStrategy for fee processing.',
    designPatterns: 'Strategy pattern for allocation and pricing. Factory for vehicles.',
    mainApproach: 'Vehicle approaches, gate allocates spot using nearest strategy, prints ticket, opens barrier.',
    edgeCases: 'Handles lot full scenario, concurrent entries at multiple gates with mutex locks.',
    tradeOffs: 'In-memory spot index chosen over disk lookups for sub-millisecond gate latency.',
    extensibility: 'Open for extension: new vehicle types like ElectricTruck require no core changes.'
  };

  it('should run the complete learner journey: start attempt -> submit -> evaluate -> verify feedback', async () => {
    // 1. Get Problem
    const problem = await problemService.getProblemBySlug('parking-lot');

    // 2. Create Attempt 1
    const attempt1 = await attemptService.createAttempt(problem.id);
    expect(attempt1.status).toBe('IN_PROGRESS');
    expect(attempt1.attemptNumber).toBeGreaterThanOrEqual(1);

    // 3. Submit design
    const subResult = await submissionService.submit(attempt1.id, {
      submissionType: 'TEXT',
      content: sampleSubmission
    });
    expect(subResult.status).toBe('SUBMITTED');

    // 4. Run evaluation directly (synchronous for test assertion)
    await evaluationService.runEvaluation(attempt1.id);

    // 5. Fetch completed attempt details
    const updatedAttempt = await attemptService.getAttemptById(attempt1.id);
    expect(updatedAttempt.status).toBe('COMPLETED');
    expect(updatedAttempt.evaluation).toBeDefined();
    expect(updatedAttempt.evaluation?.overallScore).toBeGreaterThan(0);
    expect(updatedAttempt.evaluation?.criteria).toHaveLength(8);
    expect(updatedAttempt.evaluation?.topImprovements).toHaveLength(3);

    // 6. Start Attempt 2 for the same problem (Try Again loop)
    const attempt2 = await attemptService.createAttempt(problem.id);
    expect(attempt2.attemptNumber).toBe(attempt1.attemptNumber + 1);
    expect(attempt2.status).toBe('IN_PROGRESS');

    // 7. Verify attempt history for problem
    const history = await attemptService.getAttemptsByProblem(problem.id);
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
});