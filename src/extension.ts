import * as vscode from 'vscode';
import { OptimizeCommand } from './commands/optimize.command';

export function activate(context: vscode.ExtensionContext) {
  const optimizeCommand = new OptimizeCommand();
  context.subscriptions.push(
    vscode.commands.registerCommand('json-to-toon.optimize', () => optimizeCommand.execute())
  );
}

export function deactivate() {}