import { A } from 'ts-toolbelt'

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

// @NOTE: overloaded interface
interface DirectiveMocker {
  (
    directive: ValidatorDirective,
    executionMock: A.Compute<Omit<Partial<DirectiveParams>, 'resolvedValue'>>
  ): any
}

type TransformerMock = A.Compute<
  Omit<Partial<DirectiveParams>, 'resolvedValue'>
> & {
  mockedResolvedValue: any
}

// Overload this definition for transformers
interface DirectiveMocker {
  (directive: TransformerDirective, executionMock: TransformerMock): any
}

/**
 *
 * @description
 * Used for writing directive tests e.g.
 * - Transformer directives can be passed resolvedValue
 * - Validator directives should check for errors thrown in certain situtations
 *
 * @example
 *  const mockExecution = mockRedwoodDirective(myTransformer, {
 *    context: currentUser,
 *    resolvedValue: 'Original Value',
 *  })
 *
 *  expect(mockExecution).not.toThrow()
 *  expect(mockExecution()).toEqual('Transformed Value')
 */
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
      return directive.onResolverCalled({
        resolvedValue: mockedResolvedValue,
        context: globalContext,
        ...others,
      } as DirectiveParams)
    } else {
      directive.onResolverCalled({
        context: globalContext,
        directiveArgs,
        ...others,
      } as DirectiveParams)
    }
  }
}
