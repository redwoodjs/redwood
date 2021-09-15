import type {
  ValidatorDirectiveFunc,
  TransformerDirectiveFunc,
  DirectiveParams,
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
type GqlExecutionMock = Omit<Partial<DirectiveParams>, 'getFieldValue'> & {
  mockedFieldValue?: any
}

export const mockRedwoodDirective = (
  directive: ValidatorDirectiveFunc | TransformerDirectiveFunc,
  executionMock: GqlExecutionMock
) => {
  const { mockedFieldValue, ...others } = executionMock
  return () => {
    return directive({
      fieldValue: mockedFieldValue,
      ...others,
    } as DirectiveParams) // we dont need all the values for
  }
}
