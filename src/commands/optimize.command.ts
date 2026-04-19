import * as vscode from 'vscode';
import { OptimizationMode, OptimizerService } from '../services/optimizer.service';
import { validateJson } from '../utils/jsonValidator';
import { getSelectedTextOrFull, replaceSelectedTextOrFull } from '../utils/editorHelper';

interface ExecuteOptions {
  modeOverride?: OptimizationMode;
  selectionOnly?: boolean;
}

export class OptimizeCommand {
  private optimizerService: OptimizerService;

  constructor() {
    this.optimizerService = new OptimizerService();
  }

  async execute(options: ExecuteOptions = {}): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const mode = options.modeOverride ?? vscode.workspace.getConfiguration('aiOptimizer').get<OptimizationMode>('mode', 'dsl');
    const input = this.getInputText(editor, options.selectionOnly === true);
    if (input === null) {
      return;
    }

    const validation = validateJson(input);

    if (!validation.isValid) {
      vscode.window.showErrorMessage(validation.error!);
      return;
    }

    const result = this.optimizerService.optimize(validation.data!, mode);

    if (options.selectionOnly) {
      await editor.edit(editBuilder => {
        editBuilder.replace(editor.selection, result.output);
      });
    } else {
      await replaceSelectedTextOrFull(editor, result.output);
    }

    await vscode.env.clipboard.writeText(result.output);

    const { originalTokens, optimizedTokens, savedTokens, savedPercent } = result.stats;
    const savingsMessage = savedTokens > 0
      ? `Saved ${savedTokens} tokens (${savedPercent}%) from ${originalTokens} → ${optimizedTokens}`
      : `No token savings; token count remains ${optimizedTokens}`;

    if (mode === 'toon') {
      if (result.format === 'toon') {
        vscode.window.showInformationMessage(`Optimized using TOON (k/d). ${savingsMessage}`);
      } else {
        vscode.window.showInformationMessage(`TOON not beneficial. Using JSON. ${savingsMessage}`);
      }
    } else if (result.format === 'dsl') {
      vscode.window.showInformationMessage(`Optimized using DSL. ${savingsMessage}`);
    } else {
      vscode.window.showInformationMessage(`Optimized using JSON. ${savingsMessage}`);
    }
  }

  private getInputText(editor: vscode.TextEditor, selectionOnly: boolean): string | null {
    if (selectionOnly) {
      if (editor.selection.isEmpty) {
        vscode.window.showErrorMessage('No JSON selected');
        return null;
      }
      return editor.document.getText(editor.selection);
    }

    return getSelectedTextOrFull(editor);
  }
}
