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
    async execute(options = {}) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }
        const mode = options.modeOverride ?? vscode.workspace.getConfiguration('aiOptimizer').get('mode', 'dsl');
        const input = this.getInputText(editor, options.selectionOnly === true);
        if (input === null) {
            return;
        }
        const validation = (0, jsonValidator_1.validateJson)(input);
        if (!validation.isValid) {
            vscode.window.showErrorMessage(validation.error);
            return;
        }
        const result = this.optimizerService.optimize(validation.data, mode);
        if (options.selectionOnly) {
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, result.output);
            });
        }
        else {
            await (0, editorHelper_1.replaceSelectedTextOrFull)(editor, result.output);
        }
        await vscode.env.clipboard.writeText(result.output);
        const { originalTokens, optimizedTokens, savedTokens, savedPercent } = result.stats;
        const savingsMessage = savedTokens > 0
            ? `Saved ${savedTokens} tokens (${savedPercent}%) from ${originalTokens} → ${optimizedTokens}`
            : `No token savings; token count remains ${optimizedTokens}`;
        if (mode === 'toon') {
            if (result.format === 'toon') {
                vscode.window.showInformationMessage(`Optimized using TOON (k/d). ${savingsMessage}`);
            }
            else {
                vscode.window.showInformationMessage(`TOON not beneficial. Using JSON. ${savingsMessage}`);
            }
        }
        else if (result.format === 'dsl') {
            vscode.window.showInformationMessage(`Optimized using DSL. ${savingsMessage}`);
        }
        else {
            vscode.window.showInformationMessage(`Optimized using JSON. ${savingsMessage}`);
        }
    }
    getInputText(editor, selectionOnly) {
        if (selectionOnly) {
            if (editor.selection.isEmpty) {
                vscode.window.showErrorMessage('No JSON selected');
                return null;
            }
            return editor.document.getText(editor.selection);
        }
        return (0, editorHelper_1.getSelectedTextOrFull)(editor);
    }
}
exports.OptimizeCommand = OptimizeCommand;
//# sourceMappingURL=optimize.command.js.map