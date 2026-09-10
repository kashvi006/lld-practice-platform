export interface RubricCriterionDefinition {
  key: string;
  name: string;
  maxScore: number;
  description: string;
  evaluationGuidance: string;
}

export const RUBRIC_CRITERIA: RubricCriterionDefinition[] = [
  {
    key: 'requirement_understanding',
    name: 'Requirement Understanding',
    maxScore: 10,
    description: 'Accurate translation of problem statement, functional scope, vehicle/elevator/vending constraints, and domain edge cases into the design.',
    evaluationGuidance: 'Check if core functional requirements are captured or if major requirements are ignored or misinterpreted.'
  },
  {
    key: 'class_responsibilities',
    name: 'Class Responsibilities & SRP',
    maxScore: 10,
    description: 'Single Responsibility Principle (SRP); whether classes own cohesive behavior or act as god-classes doing allocation, ticketing, and payments in one place.',
    evaluationGuidance: 'Look for separation of concerns. Are classes focused on a single domain responsibility?'
  },
  {
    key: 'encapsulation_interfaces',
    name: 'Encapsulation & Interface Design',
    maxScore: 10,
    description: 'Proper hiding of internal state, clear public contracts, and programming to interfaces rather than concrete implementations.',
    evaluationGuidance: 'Check if internal collections or mutable states are exposed. Are interfaces focused and minimal (Interface Segregation Principle)?'
  },
  {
    key: 'coupling_cohesion',
    name: 'Coupling & Cohesion',
    maxScore: 10,
    description: 'Loose coupling between distinct modules and high cohesion within each class. Minimal direct dependencies on concrete classes.',
    evaluationGuidance: 'Check whether changing one component (e.g. payment provider or spot pricing) cascades into many unrelated classes.'
  },
  {
    key: 'abstraction_patterns',
    name: 'Abstraction & Design Patterns',
    maxScore: 10,
    description: 'Thoughtful application of design patterns (Strategy, State, Factory, Observer) to handle genuine variation rather than pattern-stuffing.',
    evaluationGuidance: 'Did the learner use patterns to solve actual variation (e.g. fee strategy, elevator state, vending state) or just shoehorn patterns unnecessarily?'
  },
  {
    key: 'extensibility',
    name: 'Extensibility & OCP',
    maxScore: 10,
    description: 'Open-Closed Principle (OCP); ease of adding new vehicle types, spot types, payment methods, or dispatch strategies without modifying core classes.',
    evaluationGuidance: 'Can a new requirement be plugged in via new classes implementing existing interfaces, or does it require editing big switch-case statements?'
  },
  {
    key: 'edge_cases',
    name: 'Edge Cases & Concurrency',
    maxScore: 10,
    description: 'Identification of real-world failure scenarios (e.g., lot full, simultaneous spot allocation, elevator weight overload, exact change missing, hardware failures).',
    evaluationGuidance: 'Does the submission acknowledge boundary conditions, race conditions, or failure recovery?'
  },
  {
    key: 'explanation_quality',
    name: 'Quality of Explanation & Trade-offs',
    maxScore: 10,
    description: 'Clarity in explaining architectural rationale, trade-offs made (e.g. memory vs speed, simplicity vs flexibility), and assumptions made.',
    evaluationGuidance: 'Did the learner justify why they chose their structure and what trade-offs were accepted?'
  }
];

export const TOTAL_MAX_SCORE = RUBRIC_CRITERIA.reduce((acc, c) => acc + c.maxScore, 0); // 80