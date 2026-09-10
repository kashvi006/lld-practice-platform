import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma.js';
import { ProblemService } from '../../src/application/ProblemService.js';
import { AttemptService } from '../../src/application/AttemptService.js';
import { SubmissionService } from '../../src/application/SubmissionService.js';
import { EvaluationService } from '../../src/application/EvaluationService.js';

describe('Evaluation Failure Handling and Retry', () => {
  const problemService = new ProblemService();
  const attemptService = new AttemptService();
  const evaluationService = new EvaluationService();
  const submissionService = new SubmissionService(evaluationService);

  const sampleContent = {
    assumptions: 'Assume single car elevator with 10 floors and passenger calls.',
    requirementsInterpretation: 'Dispatcher must schedule elevator calls safely and efficiently.',
    classes: 'ElevatorController, ElevatorCar, Door, FloorButton, HallButton.',
    responsibilities: 'ElevatorController schedules calls. ElevatorCar handles physical state.',
    relationships: 'ElevatorController manages ElevatorCars. ElevatorCar contains Door.',
    interfacesAbstractions: 'IDispatchStrategy for scheduling algorithm, IObserver for floor updates.',
    designPatterns: 'State pattern for car states (Idle, Moving, DoorOpen). Strategy for dispatch.',
    mainApproach: 'Hall call triggers dispatcher, nearest idle car selected and queued.',
    edgeCases: 'Handles weight overload sensor, emergency stop button, and power loss.',
    tradeOffs: 'LOOK algorithm chosen over FCFS to minimize total passenger waiting time.',
    extensibility: 'Can add energy-saving dispatch strategy by implementing IDispatchStrategy.'
  };

  it('should preserve submission on evaluation failure and allow retry', async () => {
    const problem = await problemService.getProblemBySlug('elevator-system');
    const attempt = await attemptService.createAttempt(problem.id);

    // Submit
    await submissionService.submit(attempt.id, {
      submissionType: 'TEXT',
      content: sampleContent
    });

    // Simulate an evaluation failure (e.g. network disconnect or model failure)
    await prisma.$transaction([
      prisma.attempt.update({
        where: { id: attempt.id },
        data: { status: 'FAILED' }
      }),
      prisma.evaluation.upsert({
        where: { attemptId: attempt.id },
        create: {
          attemptId: attempt.id,
          evaluatorType: 'AI',
          status: 'FAILED',
          errorMessage: 'Simulated network timeout'
        },
        update: {
          status: 'FAILED',
          errorMessage: 'Simulated network timeout'
        }
      })
    ]);

    // Verify submission is STILL preserved!
    const failedAttempt = await attemptService.getAttemptById(attempt.id);
    expect(failedAttempt.status).toBe('FAILED');
    expect(failedAttempt.submission).toBeDefined();
    expect(failedAttempt.submission?.content.classes).toContain('ElevatorController');

    // Run evaluation retry
    await evaluationService.runEvaluation(attempt.id);

    // Verify recovered to COMPLETED
    const recoveredAttempt = await attemptService.getAttemptById(attempt.id);
    expect(recoveredAttempt.status).toBe('COMPLETED');
    expect(recoveredAttempt.evaluation?.overallScore).toBeGreaterThan(0);
  });
});