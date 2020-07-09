import {
  CodeAction,
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { HostWithDocumentsStore } from '../ide'
import { buildAndRunWithVSCodeUI } from '../interactive_cli'
import { RWProject } from '../model'
import { getOutline, outlineToJSON } from '../outline'
import { iter } from '../x/Array'
import { debounce, lazy, memo } from '../x/decorators'
import { VSCodeWindowMethods_fromConnection } from '../x/vscode'
import {
  ExtendedDiagnostic_findRelevantQuickFixes,
  ExtendedDiagnostic_groupByUri,
  Range_contains,
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
          executeCommandProvider: { commands: ['redwoodjs/cli'] },
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
          this.projectRoot = folder.uri.substr(7) // remove file://
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

    connection.onExecuteCommand(async (params) => {
      if (params.command === 'redwoodjs/cli') {
        let argss = { projectRoot: this.projectRoot!, args: {} }
        if (params.arguments && params.arguments.length > 0)
          argss = params.arguments[0]
        const { projectRoot, args } = argss
        //args = { _0: "generate", _1: "sdl" };
        const { vscodeWindowMethods, host } = this
        const project = new RWProject({ projectRoot, host })
        return await buildAndRunWithVSCodeUI({
          args,
          project,
          vscodeWindowMethods,
        })
      }
    })

    // Make the text document manager listen on the connection
    // for open, change and close text document events
    documents.listen(connection)

    // Listen on the connection
    connection.listen()
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
