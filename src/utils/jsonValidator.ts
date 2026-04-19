import { JsonValue, ValidationResult } from '../types/toon.types';

export function validateJson(input: string): ValidationResult {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: 'Input is empty' };
  }

  try {
    const data = JSON.parse(input) as JsonValue;
    return { isValid: true, data };
  } catch (error) {
    return { isValid: false, error: `Invalid JSON: ${(error as Error).message}` };
  }
}
