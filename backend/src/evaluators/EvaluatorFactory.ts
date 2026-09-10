import { IEvaluator } from './Evaluator.js';
import { RuleBasedEvaluator } from './RuleBasedEvaluator.js';
import { AIEvaluator } from './AIEvaluator.js';

export class EvaluatorFactory {
  static getEvaluator(preferredType?: string): IEvaluator {
    const targetType = (preferredType || process.env.EVALUATOR_TYPE || '').toUpperCase();

    if (targetType === 'RULE_BASED') {
      return new RuleBasedEvaluator();
    }

    if (targetType === 'AI') {
      const aiEval = new AIEvaluator();
      if (!aiEval.isAvailable()) {
        console.warn('GEMINI_API_KEY is not configured; falling back to RuleBasedEvaluator.');
        return new RuleBasedEvaluator();
      }
      return aiEval;
    }

    // Default auto-detection: If Gemini API key is available, use AI; otherwise use RuleBased
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim().length > 0) {
      return new AIEvaluator();
    }

    return new RuleBasedEvaluator();
  }
}