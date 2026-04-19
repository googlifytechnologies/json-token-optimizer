"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
function getVscode() {
    try {
        return module.require('vscode');
    }
    catch {
        return undefined;
    }
}
class Logger {
    static getOutputChannel() {
        if (!this.outputChannel) {
            const vscodeApi = getVscode();
            this.outputChannel = vscodeApi
                ? vscodeApi.window.createOutputChannel('AI JSON Optimizer')
                : {
                    appendLine: () => undefined,
                    show: () => undefined
                };
        }
        return this.outputChannel;
    }
    static log(message) {
        const channel = this.getOutputChannel();
        channel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }
    static show() {
        this.getOutputChannel().show();
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map