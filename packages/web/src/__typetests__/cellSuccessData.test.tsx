import { expectType } from 'tsd-lite'

import type { CellSuccessData } from '@redwoodjs/web'

describe('CellSuccessData', () => {
  it('omits __typename', () => {
    const value: CellSuccessData<{ foo: string; __typename: 'Foo' }> = {
      foo: '',
    }

    expectType<{ foo: string }>(value)
  })

  it('removes null and undefined from properties', () => {
    const value: CellSuccessData<{ foo?: string | null }> = { foo: '' }

    expectType<{ foo: string }>(value)
  })
})
