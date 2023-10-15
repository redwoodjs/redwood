import { expectType } from 'tsd-lite'

import type { CellSuccessData } from '@redwoodjs/web'

describe('CellSuccessData', () => {
  describe('when there is exactly one non-typename property', () => {
    it('omits __typename', () => {
      const value: CellSuccessData<{ foo: string; __typename: '' }> = {
        foo: '',
      }

      expectType<{ foo: string }>(value)
    })

    it('removes null and undefined from properties', () => {
      const value: CellSuccessData<{ foo?: string | null }> = { foo: '' }

      expectType<{ foo: string }>(value)
    })
  })

  describe('when there are multiple non-typename properties', () => {
    it('omits __typename', () => {
      const value: CellSuccessData<{
        foo: string
        bar: string
        __typename: ''
      }> = {
        foo: '',
        bar: '',
      }

      expectType<{ foo: string; bar: string }>(value)
    })

    it('does not remove null or undefined from properties', () => {
      const value: CellSuccessData<{
        foo?: string | null
        bar?: string | null
      }> = {
        foo: '',
        bar: '',
      }

      expectType<{ foo?: string | null; bar?: string | null }>(value)
    })
  })
})
