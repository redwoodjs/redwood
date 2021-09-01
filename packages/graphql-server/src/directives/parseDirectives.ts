import { DirectiveNode, DocumentNode, GraphQLResolveInfo } from 'graphql'

import { GlobalContext } from 'src/globalContext'

interface RedwoodDirective {
  name: string
  schema: DocumentNode
  onExecute: () => Promise<any> // for now just support on execute
}

export type DirectiveImplementationFunction = (
  resolverInfo?: {
    root: unknown
    context: GlobalContext
    args: Record<string, unknown>
    info: GraphQLResolveInfo
  },
  directiveNode?: DirectiveNode
) => Promise<any> | any

/* @Note: this isn't the best type
We want directivesGlobs type to be an object with this shape, but TS has limitations
declaring a record with one known key (schema), and other unknown keys
{
  fileName: {
   schema: DocumentNode // <-- required
   [string]: DirectiveImplementationFunction
  }
}
*/
type PartiallyRequired<
  Dict extends Record<string, any>,
  RequiredKey extends keyof Dict
> = Partial<Omit<Dict, RequiredKey>> & Required<Pick<Dict, RequiredKey>>

export type DirectiveGlobImports = {
  [fileIdentified: string]: PartiallyRequired<
    Record<string, DocumentNode | DirectiveImplementationFunction>,
    'schema'
  >
}

export const parseDirectives = (
  directiveGlobs: DirectiveGlobImports
): RedwoodDirective[] => {
  return Object.entries(directiveGlobs).flatMap(
    ([importedGlobName, details]) => {
      // Incase the directives get nested, their name comes as nested_directory_filename
      const directiveName = importedGlobName.split('_').pop()

      // Just because we always want to return an array, even if empty
      if (!directiveName) {
        return []
      }

      return [
        {
          name: directiveName,
          schema: details.schema as DocumentNode,
          onExecute: details[directiveName] as DirectiveImplementationFunction,
        },
      ]
    }
  )
}
