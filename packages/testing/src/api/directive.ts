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
 * @description
 *
 * Used for writing both synchronous and asynchronous directive tests e.g.
 *
 * - Transformer directives can be passed mockedResolvedValue
 * - Validator directives should check for errors thrown in certain situations
 * - Can provide args, directiveArgs and context to mock directive execution
 *
 * @example
 *
 * Synchronous transformer directive:
 *
 * ```ts
 * const mockExecution = mockRedwoodDirective(myTransformer, {
 *   context: currentUser,
 *   mockedResolvedValue: 'Original Value',
 * })
 *
 * expect(mockExecution).not.toThrow()
 * expect(mockExecution()).toEqual('Transformed Value')
 * ```ts
 *
 * @example
 *
 * Asynchronous transformer directive:
 *
 * ```ts
 * const mockExecution = mockRedwoodDirective(myTransformer, {
 *   context: currentUser,
 *   mockedResolvedValue: 'Original Value',
 * })
 *
 * await expect(mockExecution).resolves.not.toThrow()
 * await expect(mockExecution()).resolves.toEqual('Transformed Value')
 * ```
 */
export const mockRedwoodDirective: DirectiveMocker = (
  directive,
  executionMock
) => {
  const { directiveArgs, context, ...others } = executionMock

  if (context) {
    setContext(context || {})
  }

  if (directive.onResolvedValue.constructor.name === 'AsyncFunction') {
    return async () => {
      if (directive.type === DirectiveType.TRANSFORMER) {
        const { mockedResolvedValue } = others as TransformerMock
        return directive.onResolvedValue({
          resolvedValue: mockedResolvedValue,
          context: globalContext,
          directiveArgs: directiveArgs || {},
          ...others,
        } as DirectiveParams)
      } else {
        await directive.onResolvedValue({
          context: globalContext,
          directiveArgs: directiveArgs || {},
          ...others,
        } as DirectiveParams)
      }
    }
  }

  return () => {
    if (directive.type === DirectiveType.TRANSFORMER) {
      const { mockedResolvedValue } = others as TransformerMock
      return directive.onResolvedValue({
        resolvedValue: mockedResolvedValue,
        context: globalContext,
        directiveArgs: directiveArgs || {},
        ...others,
      } as DirectiveParams)
    } else {
      directive.onResolvedValue({
        context: globalContext,
        directiveArgs: directiveArgs || {},
        ...others,
      } as DirectiveParams)
    }
  }
}
