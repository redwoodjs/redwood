import { DirectiveNode, DocumentNode, GraphQLResolveInfo } from 'graphql'

import { GlobalContext } from 'src/globalContext'

interface RedwoodDirective {
  name: string
  schema: DocumentNode
  onExecute: () => Promise<any> // for now just support on execute
}

type DirectiveImplementationFunction = (
  resolverInfo?: {
    root: unknown
    context: GlobalContext
    args: Record<string, unknown>
    info: GraphQLResolveInfo
  },
  directiveNode?: DirectiveNode
) => Promise<any> | any

/* @TODO: this isn't the correct type
We want an object with this shape:
{
  schema: DocumentNode // <-- required
  [string]: DirectiveImplementationFunction
}
*/

// interface DirectiveGlobImports {
//   [fileName: string]: {
//     schema: DocumentNode
//   } & Record<string, DirectiveImplementationFunction>
// }

export const parseDirectives = (
  directiveGlobs: Record<string, any> // @TODO define this type
): RedwoodDirective[] => {
  return Object.entries(directiveGlobs).flatMap(
    ([importedGlobName, details]) => {
      // Incase the directives get nested, their name comes as nested_directory_filename
      const directiveName = importedGlobName.split('_').pop()

      // Just
      if (!directiveName) {
        return []
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
