import { ToonResult, ConversionResult, ToonValue } from '../types/toon.types';
import { extractKeys } from '../utils/keyExtractor';
import { Logger } from '../utils/logger';
import { isPrimitive, isObject } from '../utils/typeGuards';

const MAX_DEPTH = 10;

export class ToonService {
  convert(data: unknown): ConversionResult {
    Logger.log('Starting TOON conversion');
    const originalSize = JSON.stringify(data).length;

    try {
      const toon = this.convertToToon(data);
      const toonSize = JSON.stringify(toon).length;
      const sizeReduction = ((originalSize - toonSize) / originalSize) * 100;
      Logger.log(`Conversion successful. Size reduction: ${sizeReduction.toFixed(2)}%`);

      return { success: true, toon: toon as ToonResult, sizeReduction };
    } catch (error) {
      Logger.log(`Conversion failed: ${(error as Error).message}`);
      return { success: false, error: `Conversion failed: ${(error as Error).message}` };
    }
  }

  private convertToToon(value: unknown, depth: number = 0): unknown {
    if (depth > MAX_DEPTH) {
      Logger.log(`Max depth reached at level ${depth}, returning value as-is`);
      return value;
    }

    if (isPrimitive(value)) {
      return value;
    }

    if (Array.isArray(value)) {
      return this.convertArray(value, depth);
    }

    if (isObject(value)) {
      return this.convertObject(value as Record<string, unknown>, depth);
    }

    return value;
  }

  private convertObject(obj: Record<string, unknown>, depth: number): ToonResult {
    Logger.log(`Converting object at depth ${depth}`);
    const keys = Object.keys(obj);
    const values = keys.map(key => this.convertToToon(obj[key], depth + 1) as ToonValue);
    return { k: keys, d: values };
  }

  private convertArray(arr: unknown[], depth: number): ToonValue[] | ToonResult {
    Logger.log(`Converting array with ${arr.length} items at depth ${depth}`);
    if (arr.length === 0) {
      return [];
    }

    const allObjects = arr.every(item => isObject(item));
    if (!allObjects) {
      Logger.log('Array contains non-objects, returning as-is');
      return arr.map(item => this.convertToToon(item, depth + 1) as ToonValue);
    }

    // Array of objects
    const keys = extractKeys(arr as Record<string, unknown>[]);
    Logger.log(`Extracted keys: ${keys.join(', ')}`);
    const values = arr.map(item => {
      const obj = item as Record<string, unknown>;
      return keys.map(key => this.convertToToon(obj[key], depth + 1) as ToonValue);
    });
    return { k: keys, d: values };
  }
}
