export class DomainError extends Error {
  constructor(message: string, public readonly code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID '${id}' was not found.`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly details: Record<string, string> = {}) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, to: string, reason?: string) {
    super(
      `Cannot transition from state '${from}' to '${to}'.${reason ? ' ' + reason : ''}`,
      'INVALID_STATE_TRANSITION'
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export class DuplicateSubmissionError extends DomainError {
  constructor(attemptId: string) {
    super(
      `Attempt '${attemptId}' already has a submission or evaluation in progress.`,
      'DUPLICATE_SUBMISSION'
    );
    this.name = 'DuplicateSubmissionError';
  }
}

export class EvaluatorError extends DomainError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, 'EVALUATOR_ERROR');
    this.name = 'EvaluatorError';
  }
}