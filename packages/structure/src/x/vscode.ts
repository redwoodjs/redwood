import * as vscode from 'vscode'

export type VSCodeWindowMethods = Pick<
  typeof vscode.window,
  'showInformationMessage' | 'showQuickPick' | 'showInputBox'
> & {
  createTerminal2(props: { name: string; cwd: string; cmd: string }): void
} & { withProgress(opts: any, task: () => void): void }

export function VSCodeWindowMethods_fromConnection(
  connection
): VSCodeWindowMethods {
  return new VSCodeWindowMethodsWrapper(connection)
}

/**
 * these methods are exposed by decoupled studio only
 */
class VSCodeWindowMethodsWrapper implements VSCodeWindowMethods {
  constructor(private connection: any) {}
  showQuickPick(...args: any[]) {
    return this.connection.sendRequest('xxx/showQuickPick', args)
  }
  showInformationMessage(...args: any[]) {
    return this.connection.sendRequest('xxx/showInformationMessage', args)
  }
  showInputBox(...args: any[]) {
    return this.connection.sendRequest('xxx/showInputBox', args)
  }
  createTerminal2(props: { name: string; cwd: string; cmd: string }): void {
    return this.connection.sendRequest('xxx/createTerminal2', [props])
  }
  withProgress(_options: any, task: () => void) {
    // TODO:
    return task()
  }
}
