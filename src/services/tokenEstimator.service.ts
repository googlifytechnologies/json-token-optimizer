import { TokenStats } from '../types/toon.types';

export class TokenEstimatorService {
  estimateTokens(input: string): TokenStats {
    const chars = input.length;
    const bytes = Buffer.byteLength(input, 'utf8');
    const tokens = Math.ceil(chars / 4); // Approximation

    return { tokens, bytes, chars };
  }
}