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

      if (validation.isValid) {
        result = validation.data!;
      } else if (this.isToonFormat(input)) {
        result = this.reverseToon(input);
      } else {
        vscode.window.showErrorMessage('Unable to reverse: provide valid JSON or TOON input.');
        return;
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

  private reverseToon(input: string): unknown {
    const toon = JSON.parse(input) as ToonResult;
    return this.convertNestedToJson(toon);
  }

  private convertNestedToJson(value: unknown): unknown {
    if (this.isToonResult(value)) {
      const converted = this.toonService.convertToonToJson(value as ToonResult);
      return this.convertNestedToJson(converted);
    }

    if (Array.isArray(value)) {
      return value.map(item => this.convertNestedToJson(item));
    }

    if (isObject(value)) {
      const result: Record<string, unknown> = {};
      const objectValue = value as Record<string, unknown>;
      for (const [key, entry] of Object.entries(objectValue)) {
        result[key] = this.convertNestedToJson(entry);
      }
      return result;
    }

    return value;
  }
}
