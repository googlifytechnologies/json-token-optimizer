import * as vscode from 'vscode';

export function getSelectedTextOrFull(editor: vscode.TextEditor): string {
  const selection = editor.selection;
  return selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
}

export function replaceSelectedTextOrFull(editor: vscode.TextEditor, newText: string): Thenable<boolean> {
  const selection = editor.selection;
  const range = selection.isEmpty ?
    new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)) :
    selection;
  return editor.edit(editBuilder => {
    editBuilder.replace(range, newText);
  });
}