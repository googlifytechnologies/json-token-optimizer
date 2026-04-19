import type { OutputChannel } from 'vscode';

type OutputChannelLike = Pick<OutputChannel, 'appendLine' | 'show'>;

function getVscode(): typeof import('vscode') | undefined {
  try {
    return module.require('vscode') as typeof import('vscode');
  } catch {
    return undefined;
  }
}

export class Logger {
  private static outputChannel: OutputChannelLike | undefined;

  static getOutputChannel(): OutputChannelLike {
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

  static log(message: string): void {
    const channel = this.getOutputChannel();
    channel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }

  static show(): void {
    this.getOutputChannel().show();
  }
}
