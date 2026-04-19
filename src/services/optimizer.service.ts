import { JsonValue, OptimizationResult } from '../types/toon.types';
import { ToonService } from './toon.service';
import { TokenEstimatorService } from './tokenEstimator.service';
import { minifyJson } from '../utils/minifier';
import { formatOutput } from '../utils/outputFormatter';

interface OptimizeOptions {
  prettyPrint?: boolean;
}

export class OptimizerService {
  private toonService: ToonService;
  private tokenEstimator: TokenEstimatorService;

  constructor() {
    this.toonService = new ToonService();
    this.tokenEstimator = new TokenEstimatorService();
  }

  optimize(input: JsonValue, options: OptimizeOptions = {}): OptimizationResult {
    const prettyPrint = options.prettyPrint ?? false;
    const originalJson = minifyJson(input);
    const originalStats = this.tokenEstimator.estimateTokens(originalJson);

    if (!this.shouldAttemptToon(input)) {
      return this.createJsonResult(input, originalStats.tokens, prettyPrint);
    }

    const conversion = this.toonService.convert(input);
    if (!conversion.success) {
      return this.createJsonResult(input, originalStats.tokens, prettyPrint);
    }

    const toonJson = minifyJson(conversion.toon);
    const toonStats = this.tokenEstimator.estimateTokens(toonJson);

    if (toonStats.tokens < originalStats.tokens) {
      const savedTokens = originalStats.tokens - toonStats.tokens;
      const savedPercent = Math.round((savedTokens / originalStats.tokens) * 100);
      const output = formatOutput(conversion.toon, prettyPrint);
      return {
        format: 'toon',
        output,
        stats: {
          originalTokens: originalStats.tokens,
          optimizedTokens: toonStats.tokens,
          savedTokens,
          savedPercent
        }
      };
    }

    return this.createJsonResult(input, originalStats.tokens, prettyPrint);
  }

  private shouldAttemptToon(input: JsonValue): boolean {
    if (Array.isArray(input)) {
      return input.length > 0 && input.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    }

    if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
      const record = input as Record<string, unknown>;
      const keys = Object.keys(record);
      // Attempt TOON for objects with many keys or nested objects
      return keys.length > 3 || keys.some(key => typeof record[key] === 'object' && record[key] !== null);
    }

    return false;
  }

  private createJsonResult(input: JsonValue, tokenCount: number, prettyPrint: boolean): OptimizationResult {
    return {
      format: 'json',
      output: formatOutput(input, prettyPrint),
      stats: {
        originalTokens: tokenCount,
        optimizedTokens: tokenCount,
        savedTokens: 0,
        savedPercent: 0
      }
    };
  }
}
