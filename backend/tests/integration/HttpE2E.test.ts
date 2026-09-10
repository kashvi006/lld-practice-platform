import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('HTTP REST API End-to-End Tests', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/problems should return list of seeded problems', async () => {
    const res = await request(app).get('/api/problems');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/problems/:slug should return complete problem details with rubric', async () => {
    const res = await request(app).get('/api/problems/parking-lot');
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('parking-lot');
    expect(res.body.rubric).toHaveLength(8);
  });

  it('Complete HTTP workflow: Create Attempt -> Submit -> Poll Evaluation -> Verify Rubric Feedback', async () => {
    // 1. Fetch problem
    const probRes = await request(app).get('/api/problems/parking-lot');
    const problemId = probRes.body.id;

    // 2. Create Attempt
    const attemptRes = await request(app)
      .post(`/api/problems/${problemId}/attempts`)
      .send();
    expect(attemptRes.status).toBe(201);
    const attemptId = attemptRes.body.id;
    expect(attemptRes.body.status).toBe('IN_PROGRESS');

    // 3. Submit valid design
    const submitPayload = {
      content: {
        assumptions: 'Assume a 5-floor parking lot with 100 spots per floor.',
        requirementsInterpretation: 'The system must support vehicle types, spot assignment, ticketing, and exit fee calculation.',
        classes: 'ParkingLot, Floor, Spot, CompactSpot, LargeSpot, Ticket, FeeCalculator.',
        responsibilities: 'ParkingLot delegates to Floor. Spot tracks occupied state. FeeCalculator computes dues.',
        relationships: 'ParkingLot has Floors. Floor has Spots. Ticket references Spot.',
        interfacesAbstractions: 'ISpotAllocationStrategy for spot assignment, IPaymentStrategy for fee processing.',
        designPatterns: 'Strategy Pattern for fee calculation and allocation. Factory for vehicle creation.',
        mainApproach: 'Vehicle arrives, find optimal spot, issue ticket, mark occupied, calculate fee on exit.',
        edgeCases: 'Handles lot full scenario, concurrent spot allocation with locks, and lost tickets.',
        tradeOffs: 'In-memory spot lookup chosen for speed over frequent database queries.',
        extensibility: 'Can add EV charging spots by implementing Spot subclass and EVFeeStrategy.'
      }
    };

    const subRes = await request(app)
      .post(`/api/attempts/${attemptId}/submission`)
      .send(submitPayload);
    expect(subRes.status).toBe(201);
    expect(subRes.body.status).toBe('SUBMITTED');

    // 4. Poll evaluation endpoint until COMPLETED
    let isCompleted = false;
    for (let i = 0; i < 20; i++) {
      const evalRes = await request(app).get(`/api/attempts/${attemptId}/evaluation`);
      expect(evalRes.status).toBe(200);
      if (evalRes.body.status === 'COMPLETED') {
        isCompleted = true;
        expect(evalRes.body.overallScore).toBeGreaterThan(0);
        expect(evalRes.body.criteria).toHaveLength(8);
        expect(evalRes.body.topImprovements).toHaveLength(3);
        expect(evalRes.body.strengths.length).toBeGreaterThan(0);
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    expect(isCompleted).toBe(true);

    // 5. Verify attempt history includes this completed attempt
    const historyRes = await request(app).get(`/api/problems/${problemId}/attempts`);
    expect(historyRes.status).toBe(200);
    const thisAttempt = historyRes.body.find((a: any) => a.id === attemptId);
    expect(thisAttempt).toBeDefined();
    expect(thisAttempt.status).toBe('COMPLETED');
    expect(thisAttempt.score).toBeGreaterThan(0);
  });
});