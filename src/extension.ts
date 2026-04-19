import * as vscode from 'vscode';
import { OptimizeCommand } from './commands/optimize.command';
import { OptimizationMode } from './services/optimizer.service';

export function activate(context: vscode.ExtensionContext) {
  const optimizeCommand = new OptimizeCommand();

  const runOptimizer = (mode: OptimizationMode) => optimizeCommand.execute({
    modeOverride: mode,
    selectionOnly: true
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('json-to-toon.optimize', () => optimizeCommand.execute()),
    vscode.commands.registerCommand('aiOptimizer.toon', () => runOptimizer('toon')),
    vscode.commands.registerCommand('aiOptimizer.dsl', () => runOptimizer('dsl')),
    vscode.commands.registerCommand('aiOptimizer.json', () => runOptimizer('json'))
  );
}

export function deactivate() {}
