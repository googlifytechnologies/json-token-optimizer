"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizeCommand = void 0;
const vscode = require("vscode");
const optimizer_service_1 = require("../services/optimizer.service");
const jsonValidator_1 = require("../utils/jsonValidator");
const editorHelper_1 = require("../utils/editorHelper");
class OptimizeCommand {
    constructor() {
        this.optimizerService = new optimizer_service_1.OptimizerService();
    }
    async execute() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }
        const input = (0, editorHelper_1.getSelectedTextOrFull)(editor);
        const validation = (0, jsonValidator_1.validateJson)(input);
        if (!validation.isValid) {
            vscode.window.showErrorMessage(validation.error);
            return;
        }
        const result = this.optimizerService.optimize(validation.data);
        await (0, editorHelper_1.replaceSelectedTextOrFull)(editor, result.output);
        await vscode.env.clipboard.writeText(result.output);
        vscode.window.showInformationMessage('Optimized JSON copied to clipboard');
        if (result.format === 'toon') {
            vscode.window.showInformationMessage(`Optimized using TOON (k/d). Saved ${result.stats.savedPercent}% tokens (${result.stats.originalTokens} -> ${result.stats.optimizedTokens})`);
        }
        else {
            vscode.window.showInformationMessage('TOON not beneficial. Using JSON (no token savings)');
        }
    }
}
exports.OptimizeCommand = OptimizeCommand;
//# sourceMappingURL=optimize.command.js.map