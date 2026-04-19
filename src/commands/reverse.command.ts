import * as vscode from 'vscode';
import { validateJson } from '../utils/jsonValidator';
import { getSelectedTextOrFull, replaceSelectedTextOrFull } from '../utils/editorHelper';
import { ToonService } from '../services/toon.service';
import { isObject } from '../utils/typeGuards';
import type { ToonResult } from '../types/toon.types';

export class ReverseCommand {
  private toonService: ToonService;

  constructor() {
    this.toonService = new ToonService();
  }

  async execute(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const input = getSelectedTextOrFull(editor);
    if (!input) {
      vscode.window.showErrorMessage('No text selected or file is empty.');
      return;
    }

    try {
      const validation = validateJson(input);

      if (!validation.isValid) {
        vscode.window.showErrorMessage('Invalid JSON provided.');
        return;
      }

      // ✅ Always convert (single-pass, no detection needed)
      const result = this.convertNestedToJson(validation.data);

      const output = JSON.stringify(result, null, 2);

      await replaceSelectedTextOrFull(editor, output);
      await vscode.env.clipboard.writeText(output);

      vscode.window.showInformationMessage('Successfully reversed TOON → JSON.');
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to reverse: ${(error as Error).message}`
      );
    }
  }

  /**
   * Type guard for TOON structure
   */
  private isToonResult(value: unknown): value is ToonResult {
    if (!isObject(value)) return false;

    const obj = value as Record<string, unknown>;

    return (
      'k' in obj &&
      'd' in obj &&
      Array.isArray(obj.k) &&
      Array.isArray(obj.d) &&
      obj.k.every((k) => typeof k === 'string')
    );
  }

  /**
   * Core recursive converter
   */
  private convertNestedToJson(value: unknown): unknown {
    // ✅ Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.convertNestedToJson(item));
    }

    // ✅ Handle objects
    if (isObject(value)) {
      const obj = value as Record<string, unknown>;

      // ✅ Handle TOON structure
      if (this.isToonResult(obj)) {
        const keys = obj.k as string[];
        const data = obj.d as unknown[];

        // ✅ Empty TOON → []
        if (keys.length === 0 && data.length === 0) {
          return [];
        }

        // ✅ Convert rows to objects
        return data.map((row) => {
          if (!Array.isArray(row)) {
            return this.convertNestedToJson(row);
          }

          const result: Record<string, unknown> = {};

          keys.forEach((key, index) => {
            if (index < row.length) {
              result[key] = this.convertNestedToJson(row[index]);
            } else {
              result[key] = null; // or skip if you prefer
            }
          });

          return result;
        });
      }

      // ✅ Normal object recursion
      const result: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(obj)) {
        result[key] = this.convertNestedToJson(val);
      }

      return result;
    }

    // ✅ Primitive values
    return value;
  }
}