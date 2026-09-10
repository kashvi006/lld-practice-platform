import {
  ProblemSummary,
  ProblemDetail,
  AttemptDetail,
  AttemptListItem,
  RecentAttemptItem,
  EvaluationDetail,
  TextSubmissionContent
} from '../types/index.js';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      // ignore
    }
    const message = errorData.message || `Request failed with status ${res.status}`;
    const err = new Error(message) as any;
    err.details = errorData.details;
    err.status = res.status;
    err.code = errorData.error;
    throw err;
  }
  return res.json();
}

export const api = {
  async getProblems(): Promise<ProblemSummary[]> {
    const res = await fetch(`${API_BASE}/problems`);
    return handleResponse<ProblemSummary[]>(res);
  },

  async getProblem(idOrSlug: string): Promise<ProblemDetail> {
    const res = await fetch(`${API_BASE}/problems/${idOrSlug}`);
    return handleResponse<ProblemDetail>(res);
  },

  async getProblemAttempts(problemIdOrSlug: string): Promise<AttemptListItem[]> {
    const res = await fetch(`${API_BASE}/problems/${problemIdOrSlug}/attempts`);
    return handleResponse<AttemptListItem[]>(res);
  },

  async createAttempt(problemIdOrSlug: string): Promise<{ id: string; problemId: string; attemptNumber: number; status: string }> {
    const res = await fetch(`${API_BASE}/problems/${problemIdOrSlug}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  },

  async getAttempt(attemptId: string): Promise<AttemptDetail> {
    const res = await fetch(`${API_BASE}/attempts/${attemptId}`);
    return handleResponse<AttemptDetail>(res);
  },

  async getRecentAttempts(limit = 6): Promise<RecentAttemptItem[]> {
    const res = await fetch(`${API_BASE}/attempts?limit=${limit}`);
    return handleResponse<RecentAttemptItem[]>(res);
  },

  async submitDesign(attemptId: string, content: TextSubmissionContent, idempotencyKey?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/attempts/${attemptId}/submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionType: 'TEXT',
        content,
        idempotencyKey
      })
    });
    return handleResponse(res);
  },

  async getEvaluation(attemptId: string): Promise<EvaluationDetail> {
    const res = await fetch(`${API_BASE}/attempts/${attemptId}/evaluation`);
    return handleResponse<EvaluationDetail>(res);
  },

  async retryEvaluation(attemptId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/attempts/${attemptId}/evaluation/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  }
};