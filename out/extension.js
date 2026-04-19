"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const optimize_command_1 = require("./commands/optimize.command");
function activate(context) {
    const optimizeCommand = new optimize_command_1.OptimizeCommand();
    context.subscriptions.push(vscode.commands.registerCommand('json-to-toon.optimize', () => optimizeCommand.execute()));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map