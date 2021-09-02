import { DirectiveNode, DocumentNode, GraphQLResolveInfo } from 'graphql'

import { GlobalContext } from 'src/globalContext'

export interface RedwoodDirective {
  name: string
  schema: DocumentNode
  onExecute: () => Promise<any> // for now just support on execute
}

// @todo: Perhaps rename to DirectiveExecuteFunction
export type DirectiveImplementationFunction = (
  resolverInfo?: {
    root: unknown
    context: GlobalContext
    args: Record<string, unknown>
    info: GraphQLResolveInfo
  },
  directiveNode?: DirectiveNode
) => Promise<any> | any

/* @TODO: this isn't the correct type
We want directivesGlobs type to be an object with this shape:
{
  schema: DocumentNode // <-- required
  [string]: DirectiveImplementationFunction
}
*/
export type DirectiveGlobImports = Record<string, any>

export const makeDirectives = (
  directiveGlobs: DirectiveGlobImports
): RedwoodDirective[] => {
  return Object.entries(directiveGlobs).flatMap(
    ([importedGlobName, details]) => {
      // Incase the directives get nested, their name comes as nested_directory_filename_directive

      // directiveName is the filename without the directive extension
      // slice gives us ['fileName', 'directive'], so we take the first one
      const [directiveName] = importedGlobName.split('_').slice(-2)

      // Just
      if (!directiveName) {
        return []
      }

      if (typeof details[directiveName] !== 'function') {
        throw new Error(
          `Directive execution function not implemented for @${directiveName}`
        )
      }

      return [
        {
          name: directiveName,
          schema: details.schema,
          onExecute: details[directiveName],
        },
      ]
    }
  )
}
