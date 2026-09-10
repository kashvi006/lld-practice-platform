# AI Usage & Engineering Judgment Log

This document records 5 critical architectural decisions made during the design and implementation of the LLD Practice Platform, detailing what AI tools suggested, what was accepted, what was rejected, the engineering rationale, and the final implementation.

---

## Decision 1: Evaluation Scoring & Rubric Derivation

### Context
Determining how the evaluation engine calculates the overall score and grades submissions.

### What AI Suggested
- Prompt the LLM with the entire submission and ask: *"On a scale of 0 to 100, give this LLD design a score, followed by bullet points of feedback."*
- Optionally ask the LLM to output category scores and an overall score simultaneously in one JSON payload.

### What Was Accepted
- Using a fixed, standardized 8-point rubric:
  1. Requirement Understanding (10)
  2. Class Responsibilities & SRP (10)
  3. Encapsulation & Interfaces (10)
  4. Coupling & Cohesion (10)
  5. Abstraction & Design Patterns (10)
  6. Extensibility & OCP (10)
  7. Edge Cases & Concurrency (10)
  8. Quality of Explanation & Trade-offs (10)

### What Was Rejected
- **Allowing the LLM to output an independent overall score**: LLMs frequently hallucinate contradictory numbers (e.g. grading 8 criteria with scores like 5/10 and 6/10, but claiming the total score is 85/100).
- **Single holistic score**: A bare number provides zero actionable insight to the learner.

### Why
In software design pedagogy, grading must be transparent and explainable. If a student receives an 82, they must see exactly which criteria contributed to the deduction. Mathematical derivation eliminates hallucinations.

### Final Implementation
The `Evaluation` domain entity enforces strict mathematical derivation:
$$\text{overallScore} = \sum_{i=1}^{8} \text{criterion}_i.\text{score} \quad (\text{out of } 80)$$
The LLM is prompted strictly for criterion-level scores, evidence snippets, concerns, and suggestions. The domain model calculates the overall score deterministically in code.

---

## Decision 2: Evaluator Abstraction & Offline Strategy Fallback

### Context
Designing the evaluation engine and handling external AI API availability.

### What AI Suggested
- Directly call the Gemini or OpenAI API inside `SubmissionService.ts` immediately after receiving the HTTP POST request.
- Return a 500 error if the external API key is missing or the service is unreachable.

### What Was Accepted
- The **Strategy Pattern** with an `IEvaluator` interface:
  ```typescript
  export interface IEvaluator {
    readonly name: string;
    readonly type: EvaluatorType;
    evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult>;
  }
  ```
- Implementing `AIEvaluator` for LLM inference with Zod schema validation.

### What Was Rejected
- Direct coupling between the application practice service and the LLM client.
- Making the entire application dependent on live external network connections and paid API keys.

### Why
1. **Reviewer Experience**: An engineering evaluator reviewing this repository should be able to clone, run `npm test`, and execute the entire user flow immediately without configuring a paid third-party API key.
2. **Extensibility (Change Test B)**: The practice and attempt services must be agnostic to whether evaluation is conducted by Gemini, an alternative LLM, a deterministic rule-based engine, or a human mentor.

### Final Implementation
Created `RuleBasedEvaluator` alongside `AIEvaluator`, managed by `EvaluatorFactory`. If `GEMINI_API_KEY` is not present, the system seamlessly falls back to `RuleBasedEvaluator`. The app runs 100% offline out-of-the-box and passes all 26 automated tests.

---

## Decision 3: Submission Abstraction & Change Test A Extensibility

### Context
Modeling the learner submission to accommodate future diagram (Mermaid/PlantUML) or code submissions without rewriting the practice flow.

### What AI Suggested
- Create separate database tables and routes: `/api/text-submissions`, `/api/diagram-submissions`, `/api/code-submissions`.
- Create separate state machines for each submission modality.

### What Was Accepted
- A single `Submission` domain model containing a `submissionType` discriminator and an open JSON `content` payload.
- TypeScript discriminated union (`SubmissionContentPayload`) for type safety.

### What Was Rejected
- Creating multiple database tables and divergent API endpoints for each format.

### Why
The lifecycle of an attempt does not change based on the submission media: an attempt is created, design evidence is captured, the design is persisted, and an evaluation is generated. Divergent tables violate the Open-Closed Principle and needlessly duplicate lifecycle management.

### Final Implementation
`Submission` persists `submissionType: 'TEXT' | 'CODE' | 'DIAGRAM'` and a JSON string of content. Domain validation routes to the appropriate schema validator based on `submissionType`. Changing or adding submission types requires zero modifications to `AttemptService`, database tables, or HTTP routes.

---

## 4. Decision 4: Persistence Before Asynchronous Evaluation

### Context
Handling the execution flow between receiving a submission and generating evaluation feedback.

### What AI Suggested
- Execute the AI evaluation synchronously in the HTTP POST `/api/attempts/:id/submission` request, holding the HTTP connection open for 10–20 seconds until the LLM responds.
- Alternatively, introduce a full distributed message broker (RabbitMQ or Kafka) with Celery/BullMQ workers.

### What Was Accepted
- **Submission-First Persistence**: The submission is validated and written to SQLite inside a database transaction *before* evaluation is initiated.
- **Asynchronous Non-Blocking Execution**: The submission endpoint returns `201 Created` with status `SUBMITTED` within 25ms. The frontend polls `/api/attempts/:id/evaluation` and displays a live stepper.

### What Was Rejected
- Synchronous blocking HTTP requests (risks gateway timeouts and loss of learner input if the browser disconnects).
- Over-engineering with Kafka or RabbitMQ (violates the assignment's explicit rule to avoid distributed microservices infrastructure).

### Why
A learner must never lose their written design because of an external API timeout or transient network glitch. In-process non-blocking execution via Node's event loop (`setImmediate`) provides responsive UX with zero infrastructure overhead.

### Final Implementation
1. `SubmissionService.submit()` writes the submission and marks the attempt `SUBMITTED`.
2. `EvaluationService.runEvaluation()` is triggered asynchronously.
3. If evaluation fails, the attempt is marked `FAILED` with an error message, but the submission remains safely intact in the database.
4. A dedicated `/api/attempts/:id/evaluation/retry` endpoint allows the learner to re-trigger evaluation with a single click without re-typing their solution.

---

## 5. Decision 5: Non-Dogmatic AI Prompt Engineering & Structured Tone

### Context
Crafting the prompt instructions for the AI Evaluator.

### What AI Suggested
- Provide a single "golden" reference solution in the prompt and instruct the LLM: *"Compare the user's submission to this reference solution and mark anything different as incorrect."*

### What Was Rejected
- Canonical reference architecture matching.

### What Was Accepted
- A non-dogmatic prompt engineering guideline emphasizing that **multiple valid LLD designs exist**.
- Tone constraints requiring pedagogical language (*"Consider whether...", "One potential risk is...", "A more extensible approach might be..."*) rather than dogmatic assertions (*"This is wrong"*).

### Why
Real-world Low-Level Design involves trade-offs. For example, a Vending Machine can be legitimately implemented using the GoF State Pattern, or using a State Table / Finite State Machine enum with transition matrices. Claiming one is "wrong" simply because it differs from a single tutorial undermines engineering education.

### Final Implementation
`AIEvaluator` explicitly instructs the model:
> *"Multiple valid LLD designs exist. Never evaluate solely against one single canonical reference architecture. Evaluate design principles: Single Responsibility Principle (SRP), Open-Closed Principle (OCP), Interface Segregation, Encapsulation, Loose Coupling, High Cohesion, and sensible Design Pattern usage."*