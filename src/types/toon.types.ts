export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export type ToonValue = JsonValue | ToonResult;
export interface ToonResult {
  k: string[];
  d: ToonValue[] | ToonValue[][];
}

export interface ValidationResult {
  isValid: boolean;
  data?: JsonValue;
  error?: string;
}

export interface ConversionResult {
  success: boolean;
  toon?: ToonResult;
  error?: string;
  sizeReduction?: number;
}

export interface TokenStats {
  tokens: number;
  bytes: number;
  chars: number;
}

export interface OptimizationResult {
  format: 'json' | 'toon';
  output: string;
  stats: {
    originalTokens: number;
    optimizedTokens: number;
    savedTokens: number;
    savedPercent: number;
  };
}
