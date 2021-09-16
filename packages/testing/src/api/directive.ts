import type {
  DirectiveParams,
  ValidatorDirective,
  TransformerDirective,
} from '@redwoodjs/graphql-server'
import {
  context as globalContext,
  setContext,
  DirectiveType,
} from '@redwoodjs/graphql-server'

export { getDirectiveName } from '@redwoodjs/graphql-server'

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

interface DirectiveMocker {
  (
    directive: ValidatorDirective,
    executionMock: Omit<Partial<DirectiveParams>, 'resolvedValue'>
  ): any
}

type TransformerMock = Omit<Partial<DirectiveParams>, 'resolvedValue'> & {
  mockedResolvedValue: any
}
interface DirectiveMocker {
  (directive: TransformerDirective, executionMock: TransformerMock): any
}

export const mockRedwoodDirective: DirectiveMocker = (
  directive,
  executionMock
) => {
  const { directiveArgs = {}, context, ...others } = executionMock

  if (context) {
    setContext(context || {})
  }

  return () => {
    if (directive.type === DirectiveType.TRANSFORMER) {
      const { mockedResolvedValue } = others as TransformerMock
      return directive.onExecute({
        resolvedValue: mockedResolvedValue,
        context: globalContext,
        ...others,
      } as DirectiveParams)
    } else {
      directive.onExecute({
        context: globalContext,
        directiveArgs,
        ...others,
      } as DirectiveParams)
    }
  }
}
