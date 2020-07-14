import { RWProject } from '../model/RWProject'
import { memo } from '../x/decorators'
import { VSCodeWindowMethods } from '../x/vscode'

export interface Opts {
  cmd: string // "generate page" | "generate scaffold", etc
  project: RWProject
  vscodeWindowMethods: VSCodeWindowMethods
}

export function run(opts: Opts) {
  return new Runner(opts).run()
}

class Runner {
  constructor(public opts: Opts) {}
  @memo()
  async run() {
    const {
      cmd,
      project: { projectRoot },
    } = this.opts
    if (isInterceptable(cmd)) {
      await this.applyWithProgress(cmd)
    } else {
      // this.opts.window.showInformationMessage(`cmd: yarn redwood ${cmd}`);
      // return;
      this.opts.vscodeWindowMethods.createTerminal2({
        name: 'Redwood',
        cwd: projectRoot,
        cmd: 'yarn redwood ' + cmd,
      })
    }
    function isInterceptable(cmd: string) {
      return false // <--- TODO: remove this once we fix the dry run
      // if (!cmd.startsWith('generate')) return false
      // if (cmd.startsWith('generate sdl')) return false
      // if (cmd.startsWith('generate scaffold')) return false
      // return true
    }
  }
  async applyWithProgress(cmd: string) {
    await this.opts.vscodeWindowMethods.withProgress(
      {
        title: 'redwood ' + cmd,
        location: `vscode.ProgressLocation.Notification`,
      },
      () => this.applyyy(cmd)
    )
  }

  async applyyy(cmd: string) {
    this.opts.vscodeWindowMethods.showInformationMessage('run cmd ' + cmd)
    // const { stdout, files } = await redwood_gen_dry_run(
    //   projectRoot,
    //   cmd,
    //   getFileOverrides(),
    //   vscode_ExtensionContext_current().extensionPath
    // );
    // await vscode_workspace_applyEdit2({ files: new Map(files), save: true });
  }

  getFileOverrides(): any {
    // const overrides = {};
    // for (const doc of vscode.workspace.textDocuments)
    //   if (doc.isDirty) overrides[doc.fileName] = doc.getText();
    // return overrides;
  }
}
