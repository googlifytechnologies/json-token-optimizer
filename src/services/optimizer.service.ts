import { JsonValue, OptimizationResult } from '../types/toon.types';
import { TokenEstimatorService } from './tokenEstimator.service';
import { minifyJson } from '../utils/minifier';
import { toDSL } from '../utils/outputFormatter';

export type OptimizationMode = 'json' | 'toon' | 'dsl';

export class OptimizerService {
  private tokenEstimator: TokenEstimatorService;

  constructor() {
    this.tokenEstimator = new TokenEstimatorService();
  }

  optimize(input: JsonValue, mode: OptimizationMode = 'toon'): OptimizationResult {
    const originalJson = minifyJson(input);
    const originalStats = this.tokenEstimator.estimateTokens(originalJson);
    const toonApplied = { value: false };
    const transformedValue = mode === 'toon'
      ? this.optimizeRecursive(input, toonApplied)
      : this.transformRecursive(input);

    const output = mode === 'dsl'
      ? toDSL(transformedValue)
      : minifyJson(transformedValue);

    const optimizedStats = this.tokenEstimator.estimateTokens(output);
    const savedTokens = Math.max(0, originalStats.tokens - optimizedStats.tokens);
    const savedPercent = originalStats.tokens > 0
      ? Math.round((savedTokens / originalStats.tokens) * 100)
      : 0;

    return {
      format: mode === 'dsl' ? 'dsl' : (toonApplied.value ? 'toon' : 'json'),
      output,
      stats: {
        originalTokens: originalStats.tokens,
        optimizedTokens: optimizedStats.tokens,
        savedTokens,
        savedPercent
      }
    };
  }

  shouldUseToon(value: unknown): boolean {
    if (!Array.isArray(value)) {
      return false;
    }

    return value.every(item => this.isPlainObject(item));
  }

  private optimizeRecursive(value: unknown, toonApplied: { value: boolean }): unknown {
    if (Array.isArray(value)) {
      if (this.shouldUseToon(value)) {
        toonApplied.value = true;
        return this.convertArrayToToon(value as Record<string, unknown>[], toonApplied);
      }

      return value.map(item => this.optimizeRecursive(item, toonApplied));
    }

    if (this.isPlainObject(value)) {
      const transformedObject: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value)) {
        transformedObject[key] = this.optimizeRecursive(item, toonApplied);
      }
      return transformedObject;
    }

    return value;
  }

  private transformRecursive(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => this.transformRecursive(item));
    }

    if (this.isPlainObject(value)) {
      const transformedObject: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value)) {
        transformedObject[key] = this.transformRecursive(item);
      }
      return transformedObject;
    }

    return value;
  }

  private convertArrayToToon(arr: Record<string, unknown>[], toonApplied: { value: boolean }): unknown {
    const keys = Array.from(new Set(arr.flatMap(obj => Object.keys(obj))));
    const data = arr.map(obj =>
      keys.map(key => this.optimizeRecursive(obj[key] ?? null, toonApplied))
    );

    return {
      k: keys,
      d: data
    };
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
