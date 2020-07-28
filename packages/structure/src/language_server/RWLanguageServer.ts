import { normalize } from 'path'
import {
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CodeAction } from 'vscode-languageserver-types'
import { WorkDoneProgress } from 'vscode-languageserver/lib/progress'
import { HostWithDocumentsStore } from '../ide'
import { command_builder } from '../interactive_cli/command_builder'
import { redwood_gen_dry_run as dry_run } from '../interactive_cli/dry_run'
import { RedwoodCommandString } from '../interactive_cli/RedwoodCommandString'
import { VSCodeWindowUI } from '../interactive_cli/ui'
import { RWProject } from '../model'
import { getOutline, outlineToJSON } from '../outline'
import { iter } from '../x/Array'
import { debounce, lazy, memo } from '../x/decorators'
import { URL_toFile } from '../x/URL'
import { VSCodeWindowMethods_fromConnection } from '../x/vscode'
import {
  ExtendedDiagnostic_findRelevantQuickFixes,
  ExtendedDiagnostic_groupByUri,
  FileSet_fromTextDocuments,
  Range_contains,
  WorkspaceEdit_fromFileSet,
} from '../x/vscode-languageserver-types'

const REFRESH_DIAGNOSTICS_INTERVAL = 5000
const REFRESH_DIAGNOSTICS_DEBOUNCE = 500

export class RWLanguageServer {
  initializeParams!: InitializeParams
  documents = new TextDocuments(TextDocument)
  connection = createConnection(ProposedFeatures.all)
  @memo() start() {
    const { connection, documents } = this
    connection.onInitialize((params) => {
      connection.console.log(
        `Redwood.js Language Server onInitialize(), PID=${process.pid}`
      )
      this.initializeParams = params
      return {
        capabilities: {
          textDocumentSync: {
            openClose: true,
            change: TextDocumentSyncKind.Full,
          },
          // completionProvider: {
          //   resolveProvider: true,
          // },
          implementationProvider: true,
          definitionProvider: true,
          codeActionProvider: true,
          codeLensProvider: { resolveProvider: false },
          executeCommandProvider: {
            commands: ['redwoodjs/cli'],
            workDoneProgress: true,
          },
        },
      }
    })

    connection.onInitialized(async () => {
      // this is a custom method for decoupled studio
      connection.onRequest('getOutline', async () => {
        const project = this.getProject()
        if (!project) return
        return await outlineToJSON(getOutline(project))
      })

      connection.console.log('onInitialized')
      setInterval(() => this.refreshDiagnostics(), REFRESH_DIAGNOSTICS_INTERVAL)
      const folders = await connection.workspace.getWorkspaceFolders()
      if (folders) {
        for (const folder of folders) {
          this.projectRoot = normalize(folder.uri.substr(7)) // remove file://
        }
      }

      if (this.hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(() => {
          connection.console.log('Workspace folder change event received.')
        })
      }
    })
    // The content of a text document has changed. This event is emitted
    // when the text document first opened or when its content has changed.
    documents.onDidChangeContent(() => {
      this.refreshDiagnostics()
    })
    connection.onDidChangeWatchedFiles(() => {
      this.refreshDiagnostics()
    })

    connection.onImplementation(async (params) => {
      const info = await this.collectIDEInfo(params.textDocument.uri)
      for (const i of info) {
        if (i.kind === 'Implementation') {
          if (Range_contains(i.location.range, params.position)) {
            return i.target
          }
        }
      }
    })

    connection.onDefinition(async (params) => {
      const info = await this.collectIDEInfo(params.textDocument.uri)
      for (const i of info) {
        if (i.kind === 'Definition') {
          if (Range_contains(i.location.range, params.position)) {
            return i.target
          }
        }
      }
    })

    connection.onCodeAction(async ({ context, textDocument: { uri } }) => {
      const actions: CodeAction[] = []
      const node = await this.getProject()?.findNode(uri)
      if (!node) return []
      if (context.diagnostics.length > 0) {
        // find quick-fixes associated to diagnostics
        const xds = await node.collectDiagnostics()
        for (const xd of xds) {
          const as = await ExtendedDiagnostic_findRelevantQuickFixes(
            xd,
            context
          )
          for (const a of as) actions.push(a)
        }
      }
      return actions
    })

    connection.onCodeLens(async ({ textDocument: { uri } }) => {
      const info = await this.collectIDEInfo(uri)
      return iter(function* () {
        for (const i of info) if (i.kind === 'CodeLens') yield i.codeLens
      })
    })

    connection.onExecuteCommand(async (params, _token, workDoneProgress) => {
      if (params.command === 'redwoodjs/cli') {
        const [cmd, cwd] = params.arguments ?? []
        workDoneProgress?.begin('rwjs cli', undefined, 'rwjs cli message')
        await this.command__redwoodjs_cli(cmd, cwd, workDoneProgress)
      }
    })

    // Make the text document manager listen on the connection
    // for open, change and close text document events
    documents.listen(connection)

    // Listen on the connection
    connection.listen()
  }

  private async command__redwoodjs_cli(
    cmdString?: string,
    cwd?: string,
    workDoneProgress?: WorkDoneProgress
  ) {
    const { vscodeWindowMethods, host } = this
    cwd = cwd ?? this.projectRoot
    if (!cwd) return // we need a cwd to run the CLI
    // parse the cmd. this will do some checks and throw
    let cmd = new RedwoodCommandString(cmdString ?? '...')
    if (!cmd.isComplete) {
      // if the command is incomplete, we need to build it interactively
      const project = new RWProject({ projectRoot: cwd, host })
      // the interactive builder needs a UI to prompt the user
      const ui = new VSCodeWindowUI(vscodeWindowMethods)
      const cmd2 = await command_builder({ cmd, project, ui })
      if (!cmd2) return // user cancelled the interactive process
      cmd = cmd2
    }
    // run the command
    if (cmd.isInterceptable) {
      // run using dry_run so we can intercept the generated files
      const fileOverrides = FileSet_fromTextDocuments(this.documents)
      // const progress =
      //   workDoneProgress ??
      //   (await this.connection.window.createWorkDoneProgress())
      // false && progress.begin('yarn redwood ' + cmd.processed)
      workDoneProgress?.report('yarn redwood ' + cmd.processed)
      const { stdout, files } = await dry_run({
        cmd,
        cwd,
        fileOverrides,
      })
      const edit = WorkspaceEdit_fromFileSet(files, (f) => {
        if (!host.existsSync(URL_toFile(f))) return undefined
        return host.readFileSync(URL_toFile(f))
      })
      await this.connection.workspace.applyEdit({
        label: 'redwood ' + cmd.processed,
        edit,
      })
      workDoneProgress?.done()
      // false && progress.done()
    } else {
      // if it can't be intercepted, just run in the terminal
      vscodeWindowMethods.createTerminal2({
        name: 'Redwood',
        cwd,
        cmd: 'yarn redwood ' + cmd.processed,
      })
    }
  }

  projectRoot: string | undefined
  getProject() {
    if (!this.projectRoot) return undefined
    return new RWProject({ projectRoot: this.projectRoot, host: this.host })
  }
  get vscodeWindowMethods() {
    return VSCodeWindowMethods_fromConnection(this.connection)
  }
  async collectIDEInfo(uri: string) {
    const node = await this.getProject()?.findNode(uri)
    if (!node) return []
    return await node.collectIDEInfo()
  }
  @lazy() get host() {
    return new HostWithDocumentsStore(this.documents)
  }
  get hasWorkspaceFolderCapability() {
    return (
      this.initializeParams.capabilities.workspace?.workspaceFolders === true
    )
  }

  private refreshDiagnostics_previousURIs: string[] = []
  @debounce(REFRESH_DIAGNOSTICS_DEBOUNCE)
  private async refreshDiagnostics() {
    const project = this.getProject()
    if (project) {
      const ds = await project.collectDiagnostics()
      const dss = ExtendedDiagnostic_groupByUri(ds)
      const newURIs = Object.keys(dss)
      const allURIs = newURIs.concat(this.refreshDiagnostics_previousURIs)
      this.refreshDiagnostics_previousURIs = newURIs
      for (const uri of allURIs) {
        const diagnostics = dss[uri] ?? []
        this.connection.sendDiagnostics({ uri, diagnostics })
      }
    }
  }
}
