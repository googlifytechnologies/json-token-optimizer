"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceSelectedTextOrFull = exports.getSelectedTextOrFull = void 0;
const vscode = require("vscode");
function getSelectedTextOrFull(editor) {
    const selection = editor.selection;
    return selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
}
exports.getSelectedTextOrFull = getSelectedTextOrFull;
function replaceSelectedTextOrFull(editor, newText) {
    const selection = editor.selection;
    const range = selection.isEmpty ?
        new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)) :
        selection;
    return editor.edit(editBuilder => {
        editBuilder.replace(range, newText);
    });
}
exports.replaceSelectedTextOrFull = replaceSelectedTextOrFull;
//# sourceMappingURL=editorHelper.js.map