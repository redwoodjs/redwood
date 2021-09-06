import { DocumentNode } from 'graphql'

export interface ParsedDirectives {
  name: string
  schema: DocumentNode
  onExecute: () => Promise<any> // for now just support on execute
}

/*
We want directivesGlobs type to be an object with this shape:
But not fully supported in TS
{
  schema: DocumentNode // <-- required
  [string]: RedwoodDirective
}
*/
export type DirectiveGlobImports = Record<string, any>

export const makeDirectives = (
  directiveGlobs: DirectiveGlobImports
): ParsedDirectives[] => {
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
