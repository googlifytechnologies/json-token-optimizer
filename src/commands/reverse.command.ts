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
      let result: unknown;
      const validation = validateJson(input);

      if (!validation.isValid) {
        vscode.window.showErrorMessage('Unable to reverse: provide valid JSON.');
        return;
      }

      const isToon = validation.data && this.isToonResult(validation.data);
      if (isToon) {
        result = this.convertNestedToJson(validation.data!);
      } else {
        result = validation.data!;
      }

      const output = JSON.stringify(result, null, 2);
      await replaceSelectedTextOrFull(editor, output);
      await vscode.env.clipboard.writeText(output);

      vscode.window.showInformationMessage('Successfully reversed to JSON.');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to reverse: ${(error as Error).message}`);
    }
  }

  private isToonFormat(input: string): boolean {
    try {
      const parsed = JSON.parse(input);
      return this.isToonResult(parsed);
    } catch {
      return false;
    }
  }

  private isToonResult(value: unknown): value is ToonResult {
    if (!isObject(value)) {
      return false;
    }

    const objectValue = value as Record<string, unknown>;
    return 'k' in objectValue && 'd' in objectValue &&
           Array.isArray(objectValue.k) && Array.isArray(objectValue.d);
  }

  private isDeepEmptyToon(obj: unknown): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const o = obj as Record<string, unknown>;
    if ('k' in o && 'd' in o) {
      const kEmpty = this.isDeepEmptyToon(o.k) || (Array.isArray(o.k) && o.k.length === 0);
      const dEmpty = this.isDeepEmptyToon(o.d) || (Array.isArray(o.d) && o.d.length === 0);
      return kEmpty && dEmpty;
    }

    return false;
  }

  private reverseToon(input: string): unknown {
    const toon = JSON.parse(input);
    return this.convertNestedToJson(toon);
  }

  private convertNestedToJson(value: unknown): unknown {
    // Step 0: Collapse deep empty TOON structures
    if (this.isDeepEmptyToon(value)) {
      return [];
    }

    // Step 1: Handle arrays
    if (Array.isArray(value)) {
      return (value as unknown[]).map(item => this.convertNestedToJson(item));
    }

    // Step 2: Handle TOON structures
    if (isObject(value)) {
      const objectValue = value as Record<string, unknown>;
      if ('k' in objectValue && 'd' in objectValue &&
          Array.isArray(objectValue.k) && Array.isArray(objectValue.d)) {
        const keys = objectValue.k as string[];
        const data = objectValue.d as unknown[];

        // Handle empty arrays
        if (data.length === 0) {
          return [];
        }

        // Convert TOON rows to objects
        return data.map((row: unknown) => {
          if (Array.isArray(row)) {
            const obj: Record<string, unknown> = {};
            keys.forEach((key, index) => {
              obj[key] = this.convertNestedToJson((row as unknown[])[index]);
            });
            return obj;
          }
          return this.convertNestedToJson(row);
        });
      }

      // Step 3: Handle normal objects
      const result: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(objectValue)) {
        result[key] = this.convertNestedToJson(entry);
      }
      return result;
    }

    return value;
  }
}
