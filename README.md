# Low-Level Design (LLD) Practice Platform

> A focused, domain-driven learning and practice platform for Low-Level Design (LLD) interviews, featuring structured architectural submissions and explainable, rubric-grounded evaluation. Built for the CipherSchools 2-Day Engineering Assignment.

---

## 1. Project Overview & Problem Solved

Low-Level Design (LLD) problems—such as **Parking Lot**, **Elevator System**, and **Vending Machine**—are simple to attempt conceptually, but notoriously difficult to evaluate. Learners frequently draft classes, inheritance hierarchies, and data structures, but struggle with critical questions:
- *Did I violate the Single Responsibility Principle by bundling ticketing, spot allocation, and payments into one god-class?*
- *Are my interfaces appropriately segregated, or will adding an electric vehicle require modifying core classes?*
- *How resilient is my design to concurrency, race conditions, and failure rollbacks?*
- *Why did I receive a score of 72/100, and what specific architectural trade-offs should I change on my next attempt?*

Generic coding platforms (e.g. LeetCode) focus almost entirely on algorithmic correctness via automated test cases. LMS platforms deliver static video editorials without evaluating the learner's actual architectural reasoning.

**The LLD Practice Platform solves this problem** by providing:
1. **Structured LLD Practice**: An 11-dimension architectural submission format covering assumptions, classes, responsibilities, relationships, interfaces, design patterns, workflows, edge cases, trade-offs, and extensibility.
2. **Explainable Evaluation**: Rather than a meaningless numeric grade, feedback is decomposed across an **8-point architectural rubric**. Each criterion extracts concrete **evidence** from the submission, identifies the architectural **concern**, provides an actionable **suggestion**, and specifies evaluator **confidence**.
3. **Strictly Derived Scoring**: Overall scores are strictly computed as the sum of criterion scores ($\sum \text{score}_i \text{ out of } 80$). No arbitrary hallucinated numbers.
4. **Iterative Learning Loop**: Prominently displays the **Top 3 Actionable Improvements** for the next attempt and maintains chronological attempt history to measure design progression over time.

---

## 2. Core Learner Journey

```
Choose Problem
      ↓
Read Requirements & Rubric
      ↓
Start Practice (Attempt #N)
      ↓
Fill Structured Architectural Submission (11 Sections)
      ↓
Submit Design
      ↓
Asynchronous Evaluation (Live Stepper)
      ↓
Receive Explainable Feedback (Evidence, Concerns, Suggestions)
      ↓
Review Top 3 Improvements
      ↓
Try Again (Attempt #N+1)
```

---

## 3. Architecture & Tech Stack

The system is built as a **disciplined, domain-driven monolith** that avoids premature distributed complexity while maintaining strict separation of concerns.

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React + Vite)               │
│   Dashboard  │  Problem Details  │  Practice  │  Evaluation │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (Node.js + Express)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ HTTP Layer (Routes & Controllers)                     │  │
│  └───────────────────────────┬───────────────────────────┘  │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │ Application Services (Use Cases)                      │  │
│  │  ProblemService • AttemptService • SubmissionService  │  │
│  │  EvaluationService                                    │  │
│  └─────────────────┬─────────────────────────┬───────────┘  │
│  ┌─────────────────▼─────────┐   ┌───────────▼───────────┐  │
│  │ Domain Layer              │   │ Evaluator Strategy    │  │
│  │  Problem • Attempt        │   │  IEvaluator           │  │
│  │  Submission • Evaluation  │   │  ├── AIEvaluator      │  │
│  │  Rubric • Domain Errors   │   │  └── RuleBasedEval    │  │
│  └─────────────────┬─────────┘   └───────────────────────┘  │
│  ┌─────────────────▼─────────────────────────────────────┐  │
│  │ Infrastructure (Prisma ORM + SQLite + Gemini SDK)     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack Choices
- **Backend**: Node.js v20+ / v25, Express, TypeScript (strict mode, NodeNext module resolution).
- **Database & ORM**: SQLite (zero-config, self-contained single file) managed via Prisma ORM.
- **AI & Evaluation**: Strategy Pattern supporting `AIEvaluator` (Google Gemini 2.5 Flash via `@google/genai` with Zod structured output validation) and `RuleBasedEvaluator` (heuristic structural evaluator providing full offline capability).
- **Testing**: Vitest with unit and integration test suites covering domain rules, state machines, and evaluator strategies.
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React icons, React Router v6.

---

## 4. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ or v25 recommended)
- **npm**: v9.0.0 or higher

---

## 5. Installation & Setup

### 1. Clone or Open the Repository
```bash
cd C:\Users\kashv\.gemini\antigravity\scratch\lld-practice-platform
```

### 2. Quick Automated Setup (Root)
Run the root setup command, which installs dependencies, syncs the SQLite database, seeds initial problems, and builds the frontend:
```bash
npm run setup
```

Alternatively, set up backend and frontend manually:

#### Backend Setup
```bash
cd backend
npm install
npm run db:push
npm run db:seed
```

#### Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

---

## 6. Environment Variables

In `backend/.env`:
```env
DATABASE_URL="file:./dev.db"
PORT=4000
NODE_ENV=development

# Optional: Google Gemini API Key
# If set, AIEvaluator uses live Gemini 2.5 Flash with structured output.
# If omitted or left empty, EvaluatorFactory gracefully uses RuleBasedEvaluator.
GEMINI_API_KEY=""
```

> [!NOTE]
> The entire application functions **100% offline out-of-the-box** using the deterministic `RuleBasedEvaluator`. If you wish to test live LLM evaluation, simply paste your Google Gemini API key into `GEMINI_API_KEY` in `backend/.env`.

---

## 7. How to Run

### Run Backend (Port 4000)
```bash
# From repository root:
npm run dev:backend

# Or from backend directory:
cd backend
npm run dev
```
Backend API will be accessible at: `http://localhost:4000/api/problems`

### Run Frontend (Port 3000)
```bash
# In a new terminal, from repository root:
npm run dev:frontend

# Or from frontend directory:
cd frontend
npm run dev
```
Frontend web application will be accessible at: `http://localhost:3000`

---

## 8. How to Run Tests

The test suite contains **26 automated tests across 12 test files**, covering domain entities, submission validation, state transitions, duplicate prevention, evaluator strategies, and failure recovery.

```bash
# Run all tests from root:
npm run test

# Or run directly in backend with watch mode:
cd backend
npm test
npm run test:watch
```

### Test Suite Summary
- `Problem.test.ts`: Entity creation, validation of required problem fields, rubric association.
- `Submission.test.ts`: Validation of all 11 required sections, minimum character constraints, and Change Test A payload extensibility.
- `Attempt.test.ts`: Attempt state machine (`IN_PROGRESS` $\to$ `SUBMITTED` $\to$ `EVALUATING` $\to$ `COMPLETED` / `FAILED`), duplicate submission prevention.
- `Evaluation.test.ts`: Score derivation rules ($\text{overallScore} = \sum \text{criteria.score}$), percentage calculations.
- `RuleBasedEvaluator.test.ts`: Verification of heuristic evaluation, evidence extraction, concerns, and suggestions across all 8 criteria.
- `AIEvaluator.test.ts`: Zod JSON response parsing, schema normalization, and error handling on malformed AI output.
- `EvaluatorStrategy.test.ts`: Verification of Change Test B (swapping evaluators via factory without modifying calling services).
- `AttemptLifecycle.test.ts`: End-to-end integration test verifying problem selection, submission, evaluation, and starting Attempt #2.
- `DuplicateSubmission.test.ts`: Verification that repeated submit button clicks return 409 Conflict and prevent duplicate evaluations.
- `RetryEvaluation.test.ts`: Verifies that evaluation failures preserve the learner's submission and retry completes successfully.
- `NewProblemExtensibility.test.ts`: Verifies that adding a 4th problem dynamically works with zero changes to the evaluation engine.

---

## 9. Sample Walkthrough / Reviewer Flow

1. Open `http://localhost:3000` in your browser.
2. Inspect the **Dashboard** displaying the 3 seeded LLD problems (**Parking Lot**, **Multi-Car Elevator System**, and **Automated Vending Machine**).
3. Click **View Requirements** on **Parking Lot System**.
4. Read the problem statement, functional scope, constraints, and the 8-point rubric preview.
5. Click **Start Practice** to enter Attempt #1.
6. Observe the 11-section structured form with character counters and autosave indicator.
7. Fill out or test the pre-submission validation by entering short responses. Notice the client-side and server-side validation preventing dummy submissions.
8. Click **Submit Design for Evaluation**.
9. Watch the live **Evaluation Stepper** polling state (`SUBMITTED` $\to$ `EVALUATING` $\to$ `COMPLETED`).
10. Review the **Feedback Report**:
    - Circular score gauge (e.g. 62/80).
    - **Top 3 Actionable Improvements for Your Next Attempt** card.
    - Strengths and Areas for Refinement.
    - Expandable rubric criteria cards showing **Evidence**, **Concern**, **Suggestion**, and **Confidence**.
    - Original submitted design accordion.
11. Click **Try Again (Attempt #2)** to start the iterative learning loop.
12. Click **Attempt History** to view the progression of your attempts over time.

---

## 10. Extensibility Proofs

- **Change Test A (Submission Types)**: The `Submission` domain abstraction defines `SubmissionType = 'TEXT' | 'CODE' | 'DIAGRAM'`. The practice workflow and database persistence store JSON content payloads, allowing diagram submissions (Mermaid/PlantUML) to be plugged in without changing attempt state transitions.
- **Change Test B (Evaluator Types)**: The evaluation engine depends strictly on `IEvaluator`. The factory dynamically instantiates `AIEvaluator`, `RuleBasedEvaluator`, or a future `HumanEvaluator` without touching `AttemptService` or `EvaluationService`.

---

## 11. Known Limitations & Future Roadmap

1. **In-Memory Background Evaluation**: In the current MVP monolith, asynchronous evaluation runs via Node's non-blocking event loop. If the backend process crashes during evaluation, the attempt remains in `EVALUATING` and can be retried via the retry endpoint. In a distributed high-scale system, this would be backed by a reliable background worker queue (e.g. BullMQ / Redis).
2. **Authentication**: Authentication is deliberately omitted in accordance with assignment guidelines. The platform assumes a single demo learner session.
3. **Diagram Submission Rendering**: The current submission format is structured text; future iterations can add visual Mermaid.js class diagram rendering.