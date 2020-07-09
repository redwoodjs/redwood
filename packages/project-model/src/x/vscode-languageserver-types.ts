import { groupBy, mapValues } from 'lodash'
import * as tsm from 'ts-morph'
import {
  CodeAction,
  CodeActionContext,
  Diagnostic,
  DiagnosticSeverity,
  DocumentUri,
  Location,
  Position,
  Range,
} from 'vscode-languageserver-types'
import { URL_file } from './URL'

export function Range_contains(range: Range, pos: Position): boolean {
  if (Position_compare(range.start, pos) === 'greater') return false
  if (Position_compare(range.end, pos) === 'smaller') return false
  return true
}
/**
 * p1 is greater|smaller|equal than/to p2
 * @param p1
 * @param p2
 */
export function Position_compare(
  p1: Position,
  p2: Position
): 'greater' | 'smaller' | 'equal' {
  if (p1.line > p2.line) return 'greater'
  if (p2.line > p1.line) return 'smaller'
  if (p1.character > p2.character) return 'greater'
  if (p2.character > p1.character) return 'smaller'
  return 'equal'
}

export function Range_fromNode(node: tsm.Node): Range {
  const start = Position_fromTSMorphOffset(
    node.getStart(false),
    node.getSourceFile()
  )
  const end = Position_fromTSMorphOffset(node.getEnd(), node.getSourceFile())
  return { start, end }
}

export function Location_fromNode(node: tsm.Node): Location {
  return {
    uri: URL_file(node.getSourceFile().getFilePath()),
    range: Range_fromNode(node),
  }
}

export function Location_fromFilePath(filePath: string): Location {
  return { uri: URL_file(filePath), range: Range.create(0, 0, 0, 0) }
}

/**
 * returns vscode-terminal-friendly (clickable) link with line/column information
 * ex: "file:///foo.ts:2:3"
 * @param loc
 */
export function LocationLike_toLink(loc: LocationLike): string {
  const {
    uri,
    range: {
      start: { line, character },
    },
  } = LocationLike_toLocation(loc)
  return `${uri}:${line + 1}:${character + 1}`
}

export type LocationLike = tsm.Node | string | Location | ExtendedDiagnostic

export function LocationLike_toLocation(x: LocationLike): Location {
  if (typeof x === 'string') {
    return { uri: URL_file(x), range: Range.create(0, 0, 0, 0) }
  }
  if (typeof x === 'object') {
    if (x instanceof tsm.Node) return Location_fromNode(x)
    if (Location.is(x)) return x
    if (ExtendedDiagnostic_is(x))
      return { uri: x.uri, range: x.diagnostic.range }
  }
  throw new Error()
}

export function ExtendedDiagnostic_is(x: any): x is ExtendedDiagnostic {
  if (typeof x !== 'object') return false
  if (typeof x.uri !== 'string') return false
  if (!Diagnostic.is(x.diagnostic)) return false
  return true
}

export function ExtendedDiagnostic_groupByUri(
  ds: ExtendedDiagnostic[]
): { [uri: string]: Diagnostic[] } {
  const grouped = groupBy(ds, (d) => d.uri)
  return mapValues(grouped, (xds) => xds.map((xd) => xd.diagnostic))
}

export async function ExtendedDiagnostic_findRelevantQuickFixes(
  xd: ExtendedDiagnostic,
  context: CodeActionContext
): Promise<CodeAction[]> {
  // check context to see if any of the context.diagnostics are equivalent
  for (const ctx_d of context.diagnostics) {
    const node_d = xd.diagnostic
    if (Diagnostic_compare(ctx_d, node_d)) {
      if (xd.quickFix) {
        const a = await xd.quickFix()
        if (a) {
          a.kind = 'quickfix'
          a.diagnostics = [ctx_d]
          return [a]
        }
      }
    }
  }
  return []
}

export function Position_fromTSMorphOffset(
  offset: number,
  sf: tsm.SourceFile
): Position {
  const { line, column } = sf.getLineAndColumnAtPos(offset)
  return { character: column - 1, line: line - 1 }
}

/**
 * The Diagnostic interface defined in vscode-languageserver-types
 * does not include the document URI.
 * This interface adds that, and a few other things.
 */
export interface ExtendedDiagnostic {
  uri: DocumentUri
  diagnostic: Diagnostic
  /**
   * A function that returns a quickfix associated to this diagnostic.
   */
  quickFix?: () => Promise<CodeAction | undefined>
}

/**
 * Helper method to create diagnostics
 * @param node
 * @param message
 */
export function err(
  loc: LocationLike,
  message: string,
  code?: number | string
): ExtendedDiagnostic {
  const { uri, range } = LocationLike_toLocation(loc)
  return {
    uri,
    diagnostic: {
      range,
      message,
      severity: DiagnosticSeverity.Error,
      code,
    },
  }
}

export function Diagnostic_compare(d1: Diagnostic, d2: Diagnostic): boolean {
  if (d1.code !== d2.code) return false
  if (d1.message !== d2.message) return false
  if (!Range_equals(d1.range, d2.range)) return false
  return true
}

export function Range_equals(r1: Range, r2: Range): boolean {
  return toArr(r1).join(',') === toArr(r2).join(',')
  function toArr(r: Range) {
    return [r.start.line, r.start.character, r.end.line, r.end.character]
  }
}
