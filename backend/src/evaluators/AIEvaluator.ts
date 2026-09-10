import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { IEvaluator, EvaluationResult } from './Evaluator.js';
import { Problem } from '../domain/Problem.js';
import { Submission } from '../domain/Submission.js';
import { EvaluatorError } from '../domain/errors/index.js';
import { RUBRIC_CRITERIA, TOTAL_MAX_SCORE } from '../domain/Rubric.js';

const CriterionOutputSchema = z.object({
  criterionKey: z.string(),
  criterionName: z.string(),
  score: z.number().min(0).max(10),
  evidence: z.string(),
  concern: z.string(),
  suggestion: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW'])
});

const EvaluationOutputSchema = z.object({
  criteria: z.array(CriterionOutputSchema),
  strengths: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  topImprovements: z.array(z.string())
});

export class AIEvaluator implements IEvaluator {
  readonly name = 'Gemini AI Evaluator';
  readonly type = 'AI' as const;
  private readonly client?: GoogleGenAI;
  private readonly modelName: string;

  constructor(apiKey?: string, modelName = 'gemini-2.5-flash') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    this.modelName = modelName;
    if (key && key.trim().length > 0) {
      this.client = new GoogleGenAI({ apiKey: key.trim() });
    }
  }

  isAvailable(): boolean {
    return Boolean(this.client);
  }

  async evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult> {
    if (!this.client) {
      throw new EvaluatorError(
        'AIEvaluator is not configured with an API key. Set GEMINI_API_KEY or use RuleBasedEvaluator.'
      );
    }

    const content = submission.getTextContent();
    const prompt = this.buildPrompt(problem, content);

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new EvaluatorError('AI Evaluator returned an empty response.');
      }

      return this.parseAndValidateResponse(responseText);
    } catch (err: any) {
      if (err instanceof EvaluatorError) {
        throw err;
      }
      throw new EvaluatorError(`AI Evaluation failed: ${err.message || String(err)}`, err);
    }
  }

  public parseAndValidateResponse(jsonString: string): EvaluationResult {
    let parsed: any;
    try {
      // Clean potential markdown fences if present
      const cleanJson = jsonString.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e: any) {
      throw new EvaluatorError(`Failed to parse AI output as JSON: ${e.message}`, e);
    }

    const validationResult = EvaluationOutputSchema.safeParse(parsed);
    if (!validationResult.success) {
      throw new EvaluatorError(
        `AI output did not match expected rubric schema: ${validationResult.error.message}`
      );
    }

    const data = validationResult.data;

    // Ensure all 8 rubric criteria are present
    const criteriaMap = new Map(data.criteria.map(c => [c.criterionKey, c]));
    const normalizedCriteria = RUBRIC_CRITERIA.map(def => {
      const found = criteriaMap.get(def.key);
      if (found) {
        return {
          criterionKey: def.key,
          criterionName: def.name,
          score: Math.max(0, Math.min(def.maxScore, Math.round(found.score))),
          maxScore: def.maxScore,
          evidence: found.evidence || 'Reference to learner submission section.',
          concern: found.concern || 'Minor refinement suggested.',
          suggestion: found.suggestion || 'Review design principles.',
          confidence: found.confidence || 'MEDIUM'
        };
      }
      return {
        criterionKey: def.key,
        criterionName: def.name,
        score: 7,
        maxScore: def.maxScore,
        evidence: 'Overall submission analysis.',
        concern: 'Standard architectural considerations apply.',
        suggestion: def.evaluationGuidance,
        confidence: 'MEDIUM' as const
      };
    });

    // Enforce strict score derivation: sum of criteria
    const derivedOverallScore = normalizedCriteria.reduce((acc, c) => acc + c.score, 0);

    return {
      evaluatorType: this.type,
      criteria: normalizedCriteria,
      overallScore: derivedOverallScore,
      maxOverallScore: TOTAL_MAX_SCORE,
      strengths: data.strengths.slice(0, 4),
      areasToImprove: data.areasToImprove.slice(0, 4),
      topImprovements: data.topImprovements.slice(0, 3)
    };
  }

  private buildPrompt(problem: Problem, content: any): string {
    const rubricGuidance = RUBRIC_CRITERIA.map(
      c => `- ${c.key} ("${c.name}", max ${c.maxScore} pts): ${c.description} Guidance: ${c.evaluationGuidance}`
    ).join('\n');

    return `
You are a distinguished Senior Principal Software Architect and educator evaluating a learner's Low-Level Design (LLD) submission.

CRITICAL EVALUATION PHILOSOPHY:
1. Multiple valid LLD designs exist. Never evaluate solely against one single canonical reference architecture.
2. Evaluate design principles: Single Responsibility Principle (SRP), Open-Closed Principle (OCP), Interface Segregation, Encapsulation, Loose Coupling, High Cohesion, and sensible Design Pattern usage.
3. Tone must be professional, pedagogical, and constructive. Use phrasing like "Consider whether...", "One potential risk is...", "A more extensible approach might be..." rather than "This is wrong".
4. Quote or reference concrete evidence from the learner's submission in the "evidence" field.
5. Provide actionable, high-impact suggestions for each criterion.
6. The overall score MUST be derived from the sum of criterion scores. Do not fabricate an overall score.

PROBLEM STATEMENT:
Title: ${problem.title}
Statement: ${problem.problemStatement}
Functional Requirements:
${problem.functionalRequirements.map(r => `* ${r}`).join('\n')}
Constraints:
${problem.constraints.map(c => `* ${c}`).join('\n')}

LEARNER'S SUBMISSION:
1. Assumptions:
${content.assumptions}

2. Requirements Interpretation:
${content.requirementsInterpretation}

3. Classes & Entities:
${content.classes}

4. Responsibilities & SRP:
${content.responsibilities}

5. Relationships & Multiplicities:
${content.relationships}

6. Interfaces & Abstractions:
${content.interfacesAbstractions}

7. Design Patterns Used:
${content.designPatterns}

8. Main Approach & Workflow:
${content.mainApproach}

9. Edge Cases & Concurrency:
${content.edgeCases}

10. Design Trade-offs:
${content.tradeOffs}

11. Extensibility Considerations:
${content.extensibility}

RUBRIC CRITERIA TO EVALUATE (Exactly these 8 criteria):
${rubricGuidance}

OUTPUT FORMAT:
Return valid JSON adhering strictly to this JSON structure:
{
  "criteria": [
    {
      "criterionKey": "requirement_understanding",
      "criterionName": "Requirement Understanding",
      "score": 8,
      "evidence": "Learner explicitly recognized motorcycle, car, and truck spot dimensions.",
      "concern": "Did not address hourly vs daily billing models mentioned in requirements.",
      "suggestion": "Introduce a FeeCalculationStrategy to support varied billing models.",
      "confidence": "HIGH"
    }
    // repeat for all 8 criteria:
    // requirement_understanding, class_responsibilities, encapsulation_interfaces, coupling_cohesion, abstraction_patterns, extensibility, edge_cases, explanation_quality
  ],
  "strengths": [
    "Clear separation of spot allocation from vehicle domain models.",
    "Strong use of the Strategy pattern for parking fee calculation."
  ],
  "areasToImprove": [
    "ParkingLotManager combines too many responsibilities (ticketing, allocation, payment).",
    "Lacks thread synchronization or atomic reservation for concurrent spot allocation."
  ],
  "topImprovements": [
    "1. Extract spot assignment logic into a dedicated SpotAllocationService behind an interface.",
    "2. Address concurrency by specifying optimistic locking or synchronized spot status transitions.",
    "3. Decouple payment processing from ticket issuance."
  ]
}
`;
  }
}