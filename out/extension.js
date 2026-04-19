"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const optimize_command_1 = require("./commands/optimize.command");
function activate(context) {
    const optimizeCommand = new optimize_command_1.OptimizeCommand();
    const runOptimizer = (mode) => optimizeCommand.execute({
        modeOverride: mode,
        selectionOnly: true
    });
    context.subscriptions.push(vscode.commands.registerCommand('json-to-toon.optimize', () => optimizeCommand.execute()), vscode.commands.registerCommand('aiOptimizer.toon', () => runOptimizer('toon')), vscode.commands.registerCommand('aiOptimizer.dsl', () => runOptimizer('dsl')), vscode.commands.registerCommand('aiOptimizer.json', () => runOptimizer('json')));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map