import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma.js';
import { AttemptService } from '../../src/application/AttemptService.js';
import { SubmissionService } from '../../src/application/SubmissionService.js';
import { EvaluationService } from '../../src/application/EvaluationService.js';

describe('New Problem Extensibility Test', () => {
  const attemptService = new AttemptService();
  const evaluationService = new EvaluationService();
  const submissionService = new SubmissionService(evaluationService);

  it('should support adding a new LLD problem without altering the evaluation engine', async () => {
    // 1. Add a new Problem (e.g. Rate Limiter)
    const newProblem = await prisma.problem.upsert({
      where: { slug: 'rate-limiter' },
      update: {},
      create: {
        slug: 'rate-limiter',
        title: 'Distributed Rate Limiter',
        difficulty: 'MEDIUM',
        shortDescription: 'Design an extensible rate limiting service for API protection.',
        problemStatement: 'Design a distributed rate limiter that limits client requests using sliding window or token bucket algorithms.',
        functionalRequirements: JSON.stringify([
          'Limit requests per client IP or API key',
          'Configurable rate limits per endpoint',
          'Return 429 Too Many Requests on threshold breach'
        ]),
        constraints: JSON.stringify([
          'Low latency (<5ms)',
          'Thread-safe under concurrent requests'
        ]),
        assumptionsPrompts: JSON.stringify(['Redis or in-memory bucket store available']),
        suggestedConsiderations: JSON.stringify(['Strategy Pattern for TokenBucket, LeakyBucket, SlidingWindow'])
      }
    });

    expect(newProblem.id).toBeDefined();

    // 2. Start attempt for this new problem
    const attempt = await attemptService.createAttempt(newProblem.id);
    expect(attempt.status).toBe('IN_PROGRESS');

    // 3. Submit design for new problem
    await submissionService.submit(attempt.id, {
      submissionType: 'TEXT',
      content: {
        assumptions: 'Assume single region cluster with client ID extracted from HTTP headers.',
        requirementsInterpretation: 'Must intercept API calls and enforce request quotas per time window.',
        classes: 'RateLimiter, TokenBucket, SlidingWindow, ClientIdentifier, ConfigRegistry.',
        responsibilities: 'RateLimiter evaluates limits. TokenBucket manages tokens atomically.',
        relationships: 'RateLimiter uses IRateLimitStrategy. ClientIdentifier parses requests.',
        interfacesAbstractions: 'IRateLimitStrategy interface with isAllowed(clientId) contract.',
        designPatterns: 'Strategy Pattern for interchangeable rate limiting algorithms.',
        mainApproach: 'Request arrives, extract key, query strategy bucket, decrement or reject.',
        edgeCases: 'Handles burst traffic, atomic CAS operations to prevent race conditions.',
        tradeOffs: 'In-memory token bucket chosen over persistent DB for low latency.',
        extensibility: 'New algorithm can be introduced simply by implementing IRateLimitStrategy.'
      }
    });

    // 4. Run evaluation
    await evaluationService.runEvaluation(attempt.id);

    // 5. Verify successful evaluation
    const evaluated = await attemptService.getAttemptById(attempt.id);
    expect(evaluated.status).toBe('COMPLETED');
    expect(evaluated.evaluation?.criteria).toHaveLength(8);
    expect(evaluated.evaluation?.overallScore).toBeGreaterThan(0);
    expect(evaluated.evaluation?.topImprovements).toHaveLength(3);
  });
});