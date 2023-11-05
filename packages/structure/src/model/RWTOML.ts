import type { JsonMap } from '@iarna/toml'
import { parse as parseTOML } from '@iarna/toml'
import { Range } from 'vscode-languageserver-types'

import { FileNode } from '../ide'
import { lazy } from '../x/decorators'
import { err } from '../x/vscode-languageserver-types'

import type { RWProject } from './RWProject'

export class RWTOML extends FileNode {
  constructor(public filePath: string, public parent: RWProject) {
    super()
  }
  // @lazy() get content(): TOML.JsonMap {
  //   return TOML.parse(this.text)
  // }
  // TODO: diagnostics
  @lazy() get parsedTOML() {
    return parseTOML(this.text)
  }
  @lazy() get web_includeEnvironmentVariables(): string[] | undefined {
    return (
      ((this.parsedTOML?.web as JsonMap)
        ?.includeEnvironmentVariables as string[]) ?? []
    )
  }
  *diagnostics() {
    try {
      this.parsedTOML
    } catch (e: any) {
      const pos = { line: e.line - 1, character: e.column - 1 }
      const range = Range.create(pos, pos)
      // Forward the TOML parse error with correct location information
      yield err({ uri: this.uri, range }, 'TOML Parser Error: ' + e.message)
      return
    }
    // at this point we know that the TOML was parsed successfully
    //this.parsedTOML //?
    //const allowedTopElements = ['web', 'api']
    // TODO: check that schema is correct
  }
}
