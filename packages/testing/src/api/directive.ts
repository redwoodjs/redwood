import type { DocumentNode, ExecutableDefinitionNode } from 'graphql'

import type { RedwoodDirective, DirectiveArgs } from '@redwoodjs/graphql-server'

export const getDirectiveName = (schema: DocumentNode) => {
  const definition = schema.definitions.find(
    (definition) => definition.kind === 'DirectiveDefinition'
  ) as ExecutableDefinitionNode

  return definition.name?.value
}

/** Used for writing directive tests e.g.
 * @example
 *  const mockExecution = mockRedwoodDirective(uppercase, {
 *    context: currentUser,
 *    resolver: () => 'fff',
 *  })
 *
 *  expect(mockExecution).not.toThrow()
 *  expect(mockExecution()).toEqual('FFF')
 */
type GqlExecutionMock = Omit<Partial<DirectiveArgs>, 'getFieldValue'> & {
  resolver?: () => any
}

export const mockRedwoodDirective = (
  directive: RedwoodDirective,
  executionMock: GqlExecutionMock
) => {
  const { resolver = () => 'null', ...others } = executionMock
  return () => {
    return directive({
      getFieldValue: resolver,
      ...others,
    } as DirectiveArgs) // we dont need all the values for
  }
}
