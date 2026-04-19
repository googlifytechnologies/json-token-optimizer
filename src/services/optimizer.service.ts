import { JsonValue, OptimizationResult } from '../types/toon.types';
import { ToonService } from './toon.service';
import { TokenEstimatorService } from './tokenEstimator.service';
import { minifyJson } from '../utils/minifier';

interface HybridTransformResult {
  value: unknown;
  usedToon: boolean;
}

export class OptimizerService {
  private toonService: ToonService;
  private tokenEstimator: TokenEstimatorService;

  constructor() {
    this.toonService = new ToonService();
    this.tokenEstimator = new TokenEstimatorService();
  }

  optimize(input: JsonValue): OptimizationResult {
    const originalJson = minifyJson(input);
    const originalStats = this.tokenEstimator.estimateTokens(originalJson);
    const transformed = this.transformHybrid(input);
    const optimizedJson = minifyJson(transformed.value);
    const optimizedStats = this.tokenEstimator.estimateTokens(optimizedJson);
    const savedTokens = Math.max(0, originalStats.tokens - optimizedStats.tokens);
    const savedPercent = originalStats.tokens > 0
      ? Math.round((savedTokens / originalStats.tokens) * 100)
      : 0;

    return {
      format: transformed.usedToon ? 'toon' : 'json',
      output: optimizedJson,
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

    if (value.length < 2) {
      return false;
    }

    const isObjectArray = value.every(item => this.isPlainObject(item));
    if (!isObjectArray) {
      return false;
    }

    const keySet = new Set<string>();
    let commonKeys: Set<string> | null = null;
    for (const item of value) {
      const keys = Object.keys(item as Record<string, unknown>);
      const keySlice = new Set(keys);
      keys.forEach(k => keySet.add(k));

      if (commonKeys === null) {
        commonKeys = keySlice;
      } else {
        const intersection = new Set<string>();
        for (const key of commonKeys) {
          if (keySlice.has(key)) {
            intersection.add(key);
          }
        }
        commonKeys = intersection;
      }
    }

    return keySet.size > 1 && (commonKeys?.size ?? 0) > 0;
  }

  private transformHybrid(value: unknown): HybridTransformResult {
    if (this.shouldUseToon(value)) {
      const objects = value as Record<string, unknown>[];
      const transformedObjects = objects.map(obj => {
        const transformedObject: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(obj)) {
          transformedObject[key] = this.transformHybrid(item).value;
        }
        return transformedObject;
      });

      return {
        value: this.toonService.convertObjectArrayToToon(transformedObjects),
        usedToon: true
      };
    }

    if (Array.isArray(value)) {
      let usedToon = false;
      const transformedArray = value.map(item => {
        const transformed = this.transformHybrid(item);
        usedToon = usedToon || transformed.usedToon;
        return transformed.value;
      });
      return { value: transformedArray, usedToon };
    }

    if (this.isPlainObject(value)) {
      const transformedObject: Record<string, unknown> = {};
      let usedToon = false;
      for (const [key, item] of Object.entries(value)) {
        const transformed = this.transformHybrid(item);
        transformedObject[key] = transformed.value;
        usedToon = usedToon || transformed.usedToon;
      }
      return { value: transformedObject, usedToon };
    }

    return { value, usedToon: false };
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
