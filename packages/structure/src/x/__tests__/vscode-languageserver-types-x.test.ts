import { Position, Range } from 'vscode-languageserver-types'
import {
  Position_compare,
  Range_contains,
} from '../vscode-languageserver-types'

describe('Position_compare', () => {
  it('', async () => {
    x(0, 0, 0, 0, 'equal')

    x(0, 0, 0, 1, 'smaller')
    x(0, 0, 1, 0, 'smaller')
    x(0, 0, 1, 1, 'smaller')

    x(0, 1, 0, 0, 'greater')
    x(1, 0, 0, 0, 'greater')
    x(1, 1, 0, 0, 'greater')

    x(0, 2, 1, 0, 'smaller')
    function x(l1: number, c1: number, l2: number, c2: number, r: string) {
      expect(
        Position_compare(Position.create(l1, c1), Position.create(l2, c2))
      ).toEqual(r)
    }
  })
})

describe('Range_contains', () => {
  it('', async () => {
    const r = Range.create(0, 1, 0, 3)
    x(r, 0, 0, false)
    x(r, 0, 1, true)
    x(r, 0, 2, true)
    x(r, 0, 3, true)
    x(r, 0, 4, false)
    function x(r: Range, l: number, c: number, res: boolean) {
      expect(Range_contains(r, Position.create(l, c))).toEqual(res)
    }
  })
})
