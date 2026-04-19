import * as vscode from 'vscode';
import { OptimizerService } from '../services/optimizer.service';
import { validateJson } from '../utils/jsonValidator';
import { getSelectedTextOrFull, replaceSelectedTextOrFull } from '../utils/editorHelper';

export class OptimizeCommand {
  private optimizerService: OptimizerService;

  constructor() {
    this.optimizerService = new OptimizerService();
  }

  async execute(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const input = getSelectedTextOrFull(editor);
    const validation = validateJson(input);

    if (!validation.isValid) {
      vscode.window.showErrorMessage(validation.error!);
      return;
    }

    const prettyPrint = vscode.workspace.getConfiguration('aiOptimizer').get<boolean>('prettyPrint', false);
    const result = this.optimizerService.optimize(validation.data!, { prettyPrint });

    await replaceSelectedTextOrFull(editor, result.output);

    await vscode.env.clipboard.writeText(result.output);
    vscode.window.showInformationMessage('Optimized JSON copied to clipboard');

    if (result.format === 'toon') {
      vscode.window.showInformationMessage(`Optimized using TOON (k/d). Saved ${result.stats.savedPercent}% tokens (${result.stats.originalTokens} -> ${result.stats.optimizedTokens})`);
    } else {
      vscode.window.showInformationMessage('TOON not beneficial. Using JSON (no token savings)');
    }
  }
}
