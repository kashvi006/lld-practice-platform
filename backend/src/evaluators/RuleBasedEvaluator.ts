import { IEvaluator, EvaluationResult } from './Evaluator.js';
import { Problem } from '../domain/Problem.js';
import { Submission, TextSubmissionContent } from '../domain/Submission.js';
import { CriterionFeedbackProps } from '../domain/Evaluation.js';
import { RUBRIC_CRITERIA, TOTAL_MAX_SCORE } from '../domain/Rubric.js';

export class RuleBasedEvaluator implements IEvaluator {
  readonly name = 'Rule-Based Heuristic Evaluator';
  readonly type = 'RULE_BASED' as const;

  async evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult> {
    const textContent = submission.getTextContent();
    const criteria: CriterionFeedbackProps[] = [];

    // 1. Requirement Understanding
    criteria.push(this.evaluateRequirementUnderstanding(problem, textContent));

    // 2. Class Responsibilities
    criteria.push(this.evaluateClassResponsibilities(textContent));

    // 3. Encapsulation & Interfaces
    criteria.push(this.evaluateEncapsulationAndInterfaces(textContent));

    // 4. Coupling & Cohesion
    criteria.push(this.evaluateCouplingAndCohesion(textContent));

    // 5. Abstraction & Design Patterns
    criteria.push(this.evaluateDesignPatterns(textContent));

    // 6. Extensibility
    criteria.push(this.evaluateExtensibility(textContent));

    // 7. Edge Cases
    criteria.push(this.evaluateEdgeCases(textContent));

    // 8. Quality of Explanation & Trade-offs
    criteria.push(this.evaluateExplanationQuality(textContent));

    // Derive overall score strictly from criteria sum
    const overallScore = criteria.reduce((sum, c) => sum + c.score, 0);

    // Formulate strengths and areas to improve
    const strengths: string[] = [];
    const areasToImprove: string[] = [];

    for (const c of criteria) {
      if (c.score >= 8) {
        strengths.push(`${c.criterionName}: Demonstrated strong coverage (${c.evidence.slice(0, 100)}...).`);
      } else if (c.score <= 6) {
        areasToImprove.push(`${c.criterionName}: ${c.concern}`);
      }
    }

    if (strengths.length === 0) {
      strengths.push('Provided structured answers across all 11 required LLD design dimensions.');
      strengths.push('Clearly identified domain entities and fundamental workflow.');
    }

    if (areasToImprove.length === 0) {
      areasToImprove.push('Consider elaborating further on thread-safety and distributed lock semantics.');
      areasToImprove.push('Consider detailing metrics and telemetry interfaces for production monitoring.');
    }

    // Top 3 actionable improvements sorted by lowest scoring criteria
    const lowestCriteria = [...criteria].sort((a, b) => a.score - b.score).slice(0, 3);
    const topImprovements = lowestCriteria.map(
      (c, idx) => `${idx + 1}. [${c.criterionName}] ${c.suggestion}`
    );

    return {
      evaluatorType: this.type,
      criteria,
      overallScore,
      maxOverallScore: TOTAL_MAX_SCORE,
      strengths: strengths.slice(0, 4),
      areasToImprove: areasToImprove.slice(0, 4),
      topImprovements: topImprovements.slice(0, 3)
    };
  }

  private extractSnippet(text: string, maxLength = 160): string {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.slice(0, maxLength) + '...';
  }

  private evaluateRequirementUnderstanding(problem: Problem, content: TextSubmissionContent): CriterionFeedbackProps {
    const text = (content.requirementsInterpretation + ' ' + content.assumptions).toLowerCase();
    const len = content.requirementsInterpretation.trim().length;

    let score = 7;
    let concern = 'Good functional baseline, though some secondary operational requirements could be expanded.';
    let suggestion = 'Consider explicitly mapping out non-functional constraints such as response latency and concurrent access.';

    if (len > 250) score += 2;
    else if (len < 80) score -= 2;

    if (text.includes('concurrent') || text.includes('scale') || text.includes('capacity')) {
      score = Math.min(10, score + 1);
    }

    const evidence = `Requirements Interpretation: "${this.extractSnippet(content.requirementsInterpretation)}"`;

    return {
      criterionKey: 'requirement_understanding',
      criterionName: 'Requirement Understanding',
      score: Math.max(4, Math.min(10, score)),
      maxScore: 10,
      evidence,
      concern,
      suggestion,
      confidence: 'HIGH'
    };
  }

  private evaluateClassResponsibilities(content: TextSubmissionContent): CriterionFeedbackProps {
    const text = (content.classes + ' ' + content.responsibilities).toLowerCase();
    const len = content.responsibilities.trim().length;

    let score = 7;
    let concern = 'Verify that manager or coordinator classes do not become god-objects handling allocation, calculation, and persistence simultaneously.';
    let suggestion = 'Consider splitting high-level coordination from low-level strategy execution using distinct handler classes.';

    if (text.includes('manager') && (text.includes('payment') && text.includes('spot') || text.includes('ticket'))) {
      concern = 'The manager/controller class appears to combine multiple distinct responsibilities (allocation, ticketing, and calculations).';
      suggestion = 'Apply the Single Responsibility Principle: separate allocation strategy, ticket generation, and fee calculation into dedicated domain services.';
      score = 6;
    } else if (len > 300) {
      score = 8;
      concern = 'Responsibilities are well partitioned; verify whether state mutations are handled within domain entities.';
      suggestion = 'Ensure entity classes own their internal state transitions rather than leaving them purely to external services.';
    }

    const evidence = `Identified Responsibilities: "${this.extractSnippet(content.responsibilities)}"`;

    return {
      criterionKey: 'class_responsibilities',
      criterionName: 'Class Responsibilities & SRP',
      score: Math.max(4, Math.min(10, score)),
      maxScore: 10,
      evidence,
      concern,
      suggestion,
      confidence: 'HIGH'
    };
  }

  private evaluateEncapsulationAndInterfaces(content: TextSubmissionContent): CriterionFeedbackProps {
    const text = content.interfacesAbstractions.toLowerCase();
    const hasInterfaces = text.includes('interface') || text.includes('abstract') || text.includes('istrategy') || text.includes('ipolicy');

    let score = hasInterfaces ? 8 : 6;
    let concern = hasInterfaces
      ? 'Verify that interfaces adhere to the Interface Segregation Principle without forcing clients to depend on unused methods.'
      : 'Limited explicit interface definitions detected; classes may depend directly on concrete implementations.';
    let suggestion = hasInterfaces
      ? 'Ensure clients depend on narrow, role-based interfaces rather than broad utility abstractions.'
      : 'Introduce explicit interfaces (e.g., for allocation strategies or payment processors) to decouple high-level workflows from concrete implementations.';

    const evidence = `Interfaces Section: "${this.extractSnippet(content.interfacesAbstractions)}"`;

    return {
      criterionKey: 'encapsulation_interfaces',
      criterionName: 'Encapsulation & Interface Design',
      score: Math.max(4, Math.min(10, score)),
      maxScore: 10,
      evidence,
      concern,
      suggestion,
      confidence: 'HIGH'
    };
  }

  private evaluateCouplingAndCohesion(content: TextSubmissionContent): CriterionFeedbackProps {
    const text = (content.relationships + ' ' + content.classes).toLowerCase();
    const hasComposition = text.includes('composition') || text.includes('has-a') || text.includes('contains') || text.includes('aggregates');

    let score = hasComposition ? 8 : 6;
    let concern = hasComposition
      ? 'Watch for circular dependencies between domain entities and coordinator services.'
      : 'Heavy reliance on inheritance or direct association may increase tight coupling across subsystems.';
    let suggestion = 'Favor composition over inheritance and leverage dependency injection so modules remain independently testable.';

    const evidence = `Relationships: "${this.extractSnippet(content.relationships)}"`;

    return {
      criterionKey: 'coupling_cohesion',
      criterionName: 'Coupling & Cohesion',
      score: Math.max(4, Math.min(10, score)),
      maxScore: 10,
      evidence,
      concern,
      suggestion,
      confidence: 'HIGH'
    };
  }

  private evaluateDesignPatterns(content: TextSubmissionContent): CriterionFeedbackProps {
    const text = content.designPatterns.toLowerCase();
    const patterns = ['strategy', 'factory', 'state', 'observer', 'singleton', 'command'];
    const matchedPatterns = patterns.filter(p => text.includes(p));

    let score = matchedPatterns.length >= 2 ? 8 : 6;
    let concern = matchedPatterns.length === 0
      ? 'No recognized GoF design patterns explicitly identified for handling domain variations.'
      : `Identified pattern(s) (${matchedPatterns.join(', ')}); ensure patterns solve actual domain variability rather than introducing accidental complexity.`;
    let suggestion = matchedPatterns.length === 0
      ? 'Consider leveraging the Strategy pattern for interchangeable algorithms (e.g. spot assignment or dispatching) or State pattern for state machines.'
      : 'Validate that the chosen patterns keep the design open for extension without cluttering straightforward flows.';

    const evidence = `Design Patterns: "${this.extractSnippet(content.designPatterns)}"`;

    return {
      criterionKey: 'abstraction_patterns',
      criterionName: 'Abstraction & Design Patterns',
      score: Math.max(4, Math.min(10, score)),
      maxScore: 10,
      evidence,
      concern,
      suggestion,
      confidence: 'HIGH'
    };
  }

  private evaluateExtensibility(content: TextSubmissionContent): CriterionFeedbackProps {
    const text = content.extensibility.toLowerCase();
    const mentionsNewTypes = text.includes('new') || text.includes('future') || text.includes('open-closed') || text.includes('plugin');

    let score = mentionsNewTypes && content.extensibility.length > 120 ? 8 : 6;
    let concern = 'Check whether adding an unexpected new vehicle type or payment gateway would necessitate modifying existing switch-statements or core classes.';
    let suggestion = 'Document concrete extension points: demonstrate how a new requirement can be accommodated purely by adding a new class conforming to an existing interface.';

    const evidence = `Extensibility Notes: "${this.extractSnippet(content.extensibility)}"`;

    return {
      criterionKey: 'extensibility',
      criterionName: 'Extensibility & OCP',
      score: Math.max(4, Math.min(10, score)),
      maxScore: 10,
      evidence,
      concern,
      suggestion,
      confidence: 'HIGH'
    };
  }

  private evaluateEdgeCases(content: TextSubmissionContent): CriterionFeedbackProps {
    const text = content.edgeCases.toLowerCase();
    const mentionsConcurrency = text.includes('concurrent') || text.includes('race') || text.includes('lock') || text.includes('thread');
    const mentionsFull = text.includes('full') || text.includes('empty') || text.includes('limit') || text.includes('overload');

    let score = 6;
    if (mentionsConcurrency && mentionsFull) score = 9;
    else if (mentionsConcurrency || mentionsFull) score = 7;

    let concern = !mentionsConcurrency
      ? 'Concurrency considerations (e.g., race conditions on concurrent spot booking or elevator button presses) are not prominently highlighted.'
      : 'Edge cases are acknowledged; ensure failure rollback semantics (e.g. failed payment after spot allocation) are also covered.';
    let suggestion = 'Consider addressing atomic updates and optimistic/pessimistic locking mechanisms to prevent double-booking or inconsistent state.';

    const evidence = `Edge Cases: "${this.extractSnippet(content.edgeCases)}"`;

    return {
      criterionKey: 'edge_cases',
      criterionName: 'Edge Cases & Concurrency',
      score: Math.max(4, Math.min(10, score)),
      maxScore: 10,
      evidence,
      concern,
      suggestion,
      confidence: 'HIGH'
    };
  }

  private evaluateExplanationQuality(content: TextSubmissionContent): CriterionFeedbackProps {
    const text = (content.tradeOffs + ' ' + content.mainApproach).toLowerCase();
    const len = content.tradeOffs.trim().length;

    let score = len > 150 ? 8 : 6;
    let concern = 'Design trade-offs could be more thoroughly substantiated by weighing simplicity against high-concurrency flexibility.';
    let suggestion = 'Clearly outline the trade-offs: e.g., in-memory data structures provide microsecond lookups but complicate horizontal scaling and crash recovery.';

    const evidence = `Trade-offs: "${this.extractSnippet(content.tradeOffs)}"`;

    return {
      criterionKey: 'explanation_quality',
      criterionName: 'Quality of Explanation & Trade-offs',
      score: Math.max(4, Math.min(10, score)),
      maxScore: 10,
      evidence,
      concern,
      suggestion,
      confidence: 'HIGH'
    };
  }
}