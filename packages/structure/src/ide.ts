import * as fs from 'fs-extra'
import glob from 'glob'
import { basename } from 'path'
import * as tsm from 'ts-morph'
import { TextDocuments } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CodeLens, Location } from 'vscode-languageserver-types'
import { ArrayLike, ArrayLike_normalize } from './x/Array'
import { lazy, memo } from './x/decorators'
import { basenameNoExt } from './x/path'
import { createTSMSourceFile_cached } from './x/ts-morph'
import { URL_file } from './x/URL'
import { ExtendedDiagnostic } from './x/vscode-languageserver-types'

export type NodeID = string

/**
 * The host interface allows us to decouple the "model/*"
 * classes from access to the file system.
 * This is critical for editor support (ex: showing diagnostics on unsaved files)
 */
export interface Host {
  existsSync(path: string): boolean
  readFileSync(path: string): string
  readdirSync(path: string): string[]
  globSync(pattern: string): string[]
}

export type IDEInfo =
  | Definition
  | Implementation
  | Reference
  | CodeLensX
  | Hover

export interface Definition {
  kind: 'Definition'
  location: Location
  target: Location
}

export interface Implementation {
  kind: 'Implementation'
  location: Location
  target: Location
}

export interface Reference {
  kind: 'Reference'
  location: Location
  target: Location
}

export interface CodeLensX {
  kind: 'CodeLens'
  location: Location
  codeLens: CodeLens
}

export interface Hover {
  kind: 'Hover'
  location: Location
  text: string
}

export abstract class BaseNode {
  /**
   * Each node MUST have a unique ID.
   * IDs have meaningful information.
   *
   * examples:
   * - /path/to/project
   * - /path/to/project/web/src/Routes.js
   * - /path/to/project/web/src/Routes.js /route1
   */
  abstract get id(): NodeID
  abstract get parent(): BaseNode | undefined

  @lazy()
  get host(): Host {
    if (this.parent) return this.parent.host
    throw new Error(
      "Could not find host implementation on root node (you must override the 'host' gettter)"
    )
  }
  exists = true
  /**
   * Returns the children of this node.
   * Override this.
   */
  children(): ArrayLike<BaseNode> {
    return []
  }
  @memo() private _children() {
    return ArrayLike_normalize(this.children())
  }

  /**
   * Diagnostics for this node (must not include children's diagnostics).
   * Override this.
   */
  diagnostics(): ArrayLike<ExtendedDiagnostic> {
    return []
  }
  @memo() private _diagnostics() {
    return ArrayLike_normalize(this.diagnostics())
  }

  /**
   * IDE info for this node.
   * Override this.
   */
  ideInfo(): ArrayLike<IDEInfo> {
    return []
  }
  @memo() private _ideInfo() {
    return ArrayLike_normalize(this.ideInfo())
  }

  @memo()
  async collectIDEInfo(): Promise<IDEInfo[]> {
    // TODO: catch runtime errors and add them as diagnostics
    // TODO: we can parallelize this further
    const d1 = await this._ideInfo()
    const dd = await Promise.all(
      (await this._children()).map((c) => c.collectIDEInfo())
    )
    const d2 = dd.flat()
    return [...d1, ...d2]
  }

  /**
   * Collects diagnostics for this node and all descendants.
   * This is what you'll use to gather all the project diagnostics.
   */
  @memo()
  async collectDiagnostics(): Promise<ExtendedDiagnostic[]> {
    // TODO: catch runtime errors and add them as diagnostics
    // TODO: we can parallelize this further
    const d1 = await this._diagnostics()
    const dd = await Promise.all(
      (await this._children()).map((c) => c.collectDiagnostics())
    )
    const d2 = dd.flat()
    return [...d1, ...d2]
  }

  /**
   * Finds a node by ID.
   * The default algorithm tries to be economic and only create the necessary
   * intermediate nodes.
   * Subclasses can override this to add further optimizations.
   * @param id
   */
  @memo()
  async findNode(id: NodeID): Promise<BaseNode | undefined> {
    id = URL_file(id)
    if (this.id === id) return this
    if (id.startsWith(this.id))
      for (const c of await this._children()) {
        // depth first search by default
        const cc = await c.findNode(id)
        if (cc) return cc
      }
    return undefined
  }
}

export abstract class FileNode extends BaseNode {
  abstract get filePath(): string
  @lazy() get uri(): string {
    return URL_file(this.filePath)
  }
  /**
   * the ID of a FileNode is its file:// uri.
   */
  @lazy() get id() {
    return this.uri
  }
  @lazy() get text() {
    return this.host.readFileSync(this.filePath)
  }
  @lazy() get fileExists(): boolean {
    return this.host.existsSync(this.filePath)
  }
  /**
   * parsed ts-morph source file
   */
  @lazy() get sf(): tsm.SourceFile {
    if (typeof this.text === 'undefined')
      throw new Error('undefined file ' + this.filePath)
    return createTSMSourceFile_cached(this.filePath, this.text!)
  }
  @lazy() get basenameNoExt() {
    return basenameNoExt(this.filePath)
  }
  @lazy() get basename() {
    return basename(this.filePath)
  }
}

export class DefaultHost implements Host {
  existsSync(path: string) {
    return fs.existsSync(path)
  }
  readFileSync(path: string) {
    return fs.readFileSync(path, { encoding: 'utf8' }).toString()
  }
  readdirSync(path: string) {
    return fs.readdirSync(path)
  }
  globSync(pattern: string) {
    return glob.sync(pattern)
  }
}

export class HostWithDocumentsStore implements Host {
  defaultHost = new DefaultHost()
  constructor(public documents: TextDocuments<TextDocument>) {}
  readFileSync(path: string) {
    const uri = URL_file(path)
    const doc = this.documents.get(uri)
    if (doc) return doc.getText()
    return this.defaultHost.readFileSync(path)
  }
  existsSync(path: string) {
    return this.defaultHost.existsSync(path)
  }
  readdirSync(path: string) {
    return this.defaultHost.readdirSync(path)
  }
  globSync(pattern: string) {
    return this.defaultHost.globSync(pattern)
  }
}
