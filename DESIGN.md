# Architecture & Technical Design Document: LLD Practice Platform

## 1. MVP Scope

The LLD Practice Platform MVP is designed to solve a single high-value problem: **enabling software engineers to practice Low-Level Design (LLD), receive explainable rubric-based critique, and iteratively improve through structured attempts.**

### In Scope
- 3 foundational LLD problems seeded with complete requirement sets:
  1. **Parking Lot System** (Multi-floor, vehicle compatibility, dynamic spot allocation, ticketing, exit fee calculation).
  2. **Multi-Car Elevator System** (Bank of elevators, hall/car calls, supervisory dispatching, state machine, safety constraints).
  3. **Automated Vending Machine** (Inventory management, currency acceptance, state transitions, optimal change calculation, cancellation/refunds).
- Structured 11-dimension architectural submission format.
- Fixed 8-criteria evaluation rubric (10 points each, 80 total).
- Evaluator Strategy Pattern:
  - `AIEvaluator`: Powered by Google Gemini 2.5 Flash via `@google/genai` with Zod structured output validation.
  - `RuleBasedEvaluator`: Deterministic structural heuristic evaluator providing full offline capability.
- Strictly derived overall score calculation ($\text{overallScore} = \sum \text{criterion.score}$).
- Non-blocking asynchronous evaluation lifecycle (`SUBMITTED` $\to$ `EVALUATING` $\to$ `COMPLETED` / `FAILED`).
- Safe persistence before evaluation (submissions survive engine failures; retry endpoint preserves data).
- Idempotency and duplicate submission prevention.
- Chronological attempt history enabling the iterative learning loop (Attempt 1 $\to$ Feedback $\to$ Attempt 2).
- Clean developer tool UI with autosave draft mechanism in `localStorage`.

### Out of Scope (Deliberately Avoided)
- Distributed queues (Kafka, RabbitMQ), microservices, and Kubernetes clusters (unnecessary operational overhead for an MVP monolith).
- Custom drag-and-drop UML drawing tools or cloud code execution sandboxes.
- Complex authentication schemes (single demo user session assumed).

---

## 2. Core User Journey

```
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ 1. Dashboard    │ ───►  │ 2. Problem Detail      │ ───►  │ 3. Practice Workspace  │
│  Browse Problems│       │  Requirements & Rubric │       │  Fill 11 Dimensions    │
└─────────────────┘       └────────────────────────┘       └───────────┬────────────┘
                                                                       │ Submit
                                                                       ▼
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ 6. Try Again    │ ◄───  │ 5. Feedback Report     │ ◄───  │ 4. Evaluation Stepper  │
│  Start Attempt 2│       │  Score, Evidence, Top 3│       │  Non-blocking Polling  │
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
```

---

## 3. Architecture & Monolith Structure

The backend follows a **layered, domain-driven monolithic design**:

```
backend/src/
├── domain/                  # Pure Enterprise Business Rules (Zero external dependencies)
│   ├── Problem.ts           # Problem entity & rubric binding
│   ├── Attempt.ts           # Attempt aggregate & state machine rules
│   ├── Submission.ts        # Submission entity & 11-section validation rules
│   ├── Evaluation.ts        # Evaluation entity & derived score invariants
│   ├── Rubric.ts            # Rubric criteria definitions & max score constants
│   └── errors/              # Domain-specific error hierarchies
├── application/             # Application Use Cases & Orchestration Services
│   ├── ProblemService.ts    # Problem querying & attempt count aggregation
│   ├── AttemptService.ts    # Attempt lifecycle, sequencing, and history
│   ├── SubmissionService.ts # Submission persistence & evaluation dispatching
│   └── EvaluationService.ts # Asynchronous evaluation coordinator & retry handler
├── evaluators/              # Evaluator Strategy Pattern
│   ├── Evaluator.ts         # IEvaluator interface & evaluation result contracts
│   ├── AIEvaluator.ts       # Gemini API client with Zod JSON validation
│   ├── RuleBasedEvaluator.ts# Heuristic structural analysis engine
│   └── EvaluatorFactory.ts  # Strategy factory selecting AI vs Rule-Based
├── infrastructure/          # External Concerns & Gateways
│   ├── db/prisma.ts         # Prisma ORM client singleton
│   └── ai/                  # AI client configurations
└── routes/                  # Express HTTP Controllers & Error Middleware
    ├── problemRoutes.ts     # /api/problems endpoints
    └── attemptRoutes.ts     # /api/attempts endpoints
```

### Why This Structure?
1. **Domain Isolation**: Pure domain entities (`Problem`, `Attempt`, `Submission`, `Evaluation`) contain business invariants independent of Express, Prisma, or external AI APIs.
2. **Framework Independence**: The application layer orchestrates use cases without leaking HTTP response logic into the business core.
3. **Pluggable Evaluation**: The practice flow depends solely on `IEvaluator`, ensuring evaluation engine changes never touch practice routing or submission storage.

---

## 4. Domain Model & Entities

### Conceptual Entity Diagram
```
┌─────────────────────────┐
│        Problem          │
│ id, slug, title         │
│ statement, requirements │
└────────────┬────────────┘
             │ 1
             │
             │ *
┌────────────▼────────────┐
│        Attempt          │
│ id, attemptNumber       │
│ status (IN_PROGRESS...) │
└──────┬────────────┬─────┘
       │ 1          │ 1
       │            │
       │ 1          │ 1
┌──────▼────────┐ ┌─▼───────────────────────┐
│  Submission   │ │       Evaluation        │
│ type: TEXT    │ │ overallScore (Derived)  │
│ content: JSON │ │ strengths, topImprov... │
└───────────────┘ └───────────┬─────────────┘
                              │ 1
                              │
                              │ *
                  ┌───────────▼─────────────┐
                  │    CriterionFeedback    │
                  │ key, score, maxScore    │
                  │ evidence, concern, sugg │
                  └─────────────────────────┘
```

### Important Classes & Responsibilities

| Class | Primary Responsibility | Key Invariants / Behavior Owned |
|---|---|---|
| **Problem** | Defines the challenge, requirements, constraints, and associates the rubric. | Validates required fields; returns standardized rubric criteria. |
| **Attempt** | Represents one learner trial of a problem; owns the attempt lifecycle. | Enforces state machine transitions; prevents duplicate submissions; enforces retry eligibility. |
| **Submission** | Encapsulates the learner's submitted architecture across the 11 dimensions. | Validates that all 11 sections exist and meet the minimum content length threshold ($\ge 15$ chars). |
| **Evaluation** | Encapsulates assessment results across the 8 rubric dimensions. | Strictly enforces the derived score rule: $\text{overallScore} = \sum \text{criterion.score}$. |
| **CriterionFeedback** | Stores granular analysis for a specific rubric dimension. | Holds evidence snippet, concern, suggestion, score, and confidence level. |

---

## 5. Evaluation Architecture: Strategy Pattern

Evaluation is completely decoupled from the practice flow:

```
Practice Flow (SubmissionService)
               │
               ▼
       EvaluationService
               │
               ▼
      EvaluatorFactory
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐ ┌────────────────────┐
│ AIEvaluator  │ │ RuleBasedEvaluator │
│ (Gemini 2.5) │ │ (Heuristic Offline)│
└──────────────┘ └────────────────────┘
```

### The `IEvaluator` Contract
```typescript
export interface IEvaluator {
  readonly name: string;
  readonly type: EvaluatorType;
  evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult>;
}
```

### Why Strategy Pattern?
- Eliminates hardcoded dependencies on a single AI provider.
- Guarantees that the entire application and all automated test suites run deterministically in CI/CD without requiring external API keys.
- Facilitates Change Test B (swapping or adding a human evaluator).

---

## 6. Deterministic vs AI Evaluation Responsibilities

| Evaluation Aspect | Handled By | Mechanism | Rationale |
|---|---|---|---|
| **Required Sections Present** | Deterministic | `Submission.validate()` | Objective rule. Eliminates empty submissions before wasting LLM tokens. |
| **Minimum Content Length** | Deterministic | Character count thresholds | Prevents single-character or dummy submissions. |
| **State Machine Transitions** | Deterministic | `Attempt.markSubmitted()` | Enforces valid lifecycle states and prevents illegal jumps. |
| **Idempotency / Duplicates** | Deterministic | Attempt status checks | Prevents double-clicking submit from launching duplicate evaluations. |
| **Score Summation** | Deterministic | `Evaluation.computeDerivedScore()` | Prevents LLM hallucinations from returning contradictory overall scores. |
| **Class Responsibilities & SRP** | AI / Heuristic | Semantic analysis against prompt | Subjective architectural assessment. |
| **Coupling & Cohesion** | AI / Heuristic | Dependency & relationship analysis | Evaluates appropriate use of composition over inheritance. |
| **Abstraction & Design Patterns** | AI / Heuristic | Pattern suitability checks | Evaluates whether patterns solve genuine domain variation. |
| **Edge Cases & Concurrency** | AI / Heuristic | Boundary & thread-safety analysis | Evaluates handling of race conditions, deadlocks, and failure recovery. |
| **Actionable Suggestions** | AI / Heuristic | Suggestion synthesis | Formulates constructive, non-dogmatic next steps. |

---

## 7. Evaluation State Machine & Failure Handling

### State Transitions
```
                ┌────────────────────────────────────────┐
                │                                        │
                ▼                                        │ Retry
[IN_PROGRESS] ──► [SUBMITTED] ──► [EVALUATING] ──► [COMPLETED]
                                        │
                                        ▼ (on error)
                                    [FAILED]
```

### Resiliency Guarantees
1. **Submission-First Persistence**: The submission payload is written to SQLite inside a database transaction *before* the asynchronous evaluation is triggered. If the evaluation service encounters a timeout or crash, the learner's submission remains 100% intact.
2. **Duplicate Prevention (Idempotency)**: Once an attempt enters `SUBMITTED`, `EVALUATING`, or `COMPLETED`, subsequent submit calls are rejected with `409 Conflict` (`DuplicateSubmissionError`).
3. **Graceful Error Recovery**: If the AI API returns a 500 error or malformed JSON, the attempt is transitioned to `FAILED` with an informative error message. The learner can click **Retry Evaluation**, which transitions the attempt back to `EVALUATING` and re-runs the evaluator without re-typing their solution.

---

## 8. Extensibility Tests

### Change Test A: Moving from Text to Class Diagram Submissions
* **Scenario**: The platform adds visual diagram submissions (e.g. Mermaid or PlantUML).
* **Impact on Architecture**:
  - `SubmissionContent` is modeled as an extensible discriminated union:
    ```typescript
    export type SubmissionContentPayload =
      | { type: 'TEXT'; data: TextSubmissionContent }
      | { type: 'DIAGRAM'; data: DiagramSubmissionContent }
      | { type: 'CODE'; data: CodeSubmissionContent };
    ```
  - The database stores content as a flexible JSON column.
  - The `Attempt` lifecycle (`IN_PROGRESS` $\to$ `SUBMITTED` $\to$ `EVALUATING` $\to$ `COMPLETED`) remains completely unchanged.
  - Zero changes are required to `ProblemService`, `AttemptService`, or the HTTP route structure.

### Change Test B: Swapping Evaluators (AI to Rule-Based or Human Reviewer)
* **Scenario**: Adding a human expert reviewer or switching between AI providers.
* **Impact on Architecture**:
  - Any evaluator implementing `IEvaluator` satisfies the contract.
  - `EvaluatorFactory.getEvaluator()` selects the strategy based on configuration.
  - The `EvaluationService` and HTTP controllers never know or care which evaluator executed the evaluation.
  - Demonstrated directly in our test suite with `MockHumanEvaluator`.

---

## 9. Key Trade-offs & Design Decisions

1. **Structured Text Submission vs Full UML Editor / Code Sandbox**:
   - *Decision*: Adopted a structured 11-field text submission format.
   - *Trade-off*: Sacrificed visual drag-and-drop diagramming in exchange for zero UI friction, rapid learner iteration, and focused assessment of architectural reasoning rather than drawing layout mechanics.
2. **Simple Monolith vs Distributed Microservices**:
   - *Decision*: Single Node.js/Express monolith with SQLite and React.
   - *Trade-off*: Sacrificed distributed multi-node horizontal scalability in exchange for extreme implementation clarity, zero DevOps friction, zero network latency between services, and instant 1-command startup.
3. **In-Process Async Evaluation vs Distributed Message Queue (Kafka/BullMQ)**:
   - *Decision*: Used Node's non-blocking `setImmediate` event loop for background evaluation.
   - *Trade-off*: If the Node process terminates during evaluation, the job must be retried via the retry endpoint. This eliminates the operational burden of running Redis or Kafka brokers for an assignment MVP.

---

## 10. Future High-Level Design (HLD) Scaling Considerations

If the platform scales to 100,000+ daily learners:
1. **Background Job Queue**: Replace `setImmediate` with **BullMQ + Redis** or **AWS SQS** to ensure evaluation jobs survive process crashes with automatic backoff retries.
2. **Dedicated Evaluator Workers**: Decouple the evaluation engine into an independent worker pool so compute-heavy LLM calls or code execution do not tie up the HTTP web servers.
3. **Read Replicas & Caching**: Introduce Redis caching for static Problem details and PostgreSQL read-replicas for attempt history queries.
4. **LLM Response Semantic Caching**: Hash identical problem submissions to return instant cached evaluations for common architectural patterns.