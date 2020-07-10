import { parse as parseGraphQL } from 'graphql'
import * as tsm from 'ts-morph'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { lazy } from '../x/decorators'
import {
  err,
  ExtendedDiagnostic,
  Range_fromNode,
} from '../x/vscode-languageserver-types'
import { RWComponent } from './RWComponent'

export class RWCell extends RWComponent {
  /**
   * A "Cell" is a component that ends in `Cell.{js, jsx, tsx}`, but does not
   * have a default export AND does not export `QUERY`
   **/
  @lazy() get isCell() {
    return !this.hasDefaultExport && this.exportedSymbols.has('QUERY')
  }

  *diagnostics() {
    // check that QUERY and Success are exported
    if (!this.exportedSymbols.has('QUERY')) {
      yield err(
        this.uri,
        'Every Cell MUST export a QUERY variable (GraphQL query string)'
      )
    }

    // TODO: This could very likely be added into RWCellQUERY
    for (const d of this.sf.getDescendantsOfKind(
      tsm.SyntaxKind.VariableDeclaration
    )) {
      if (d.isExported() && d.getName() === 'QUERY') {
        // Check that exported QUERY is syntactically valid GraphQL.
        const gqlNode = d
          .getDescendantsOfKind(tsm.SyntaxKind.TaggedTemplateExpression)[0]
          .getChildAtIndex(1)
        const gqlText = gqlNode.getText().replace(/\`/g, '')
        try {
          parseGraphQL(gqlText)
        } catch (e) {
          // TODO: Make this point to the exact location included in the error.
          yield {
            uri: this.uri,
            diagnostic: {
              range: Range_fromNode(gqlNode),
              message: e.message,
              severity: DiagnosticSeverity.Error,
            },
          } as ExtendedDiagnostic
        }
      }
    }
    // TODO: check that exported QUERY is semantically valid GraphQL (fields exist)
    if (!this.exportedSymbols.has('Success')) {
      yield err(
        this.uri,
        'Every Cell MUST export a Success variable (React Component)'
      )
    }
  }
}
