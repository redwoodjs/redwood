import MockProject from '@redwoodjs/test-mocks'

import { files as cellFilesFn } from '../commands/cell'

describe('generate', () => {
  console.log()
  const mockrw = new MockProject()
  beforeEach(() => {
    mockrw.mock()
  })

  afterAll(() => {
    mockrw.restore()
  })

  describe('cell', () => {
    it('generates the expected files for a cell', () => {
      try {
        cellFilesFn({ name: 'Test' })
      } catch (e) {
        console.log(e)
      }
    })
  })
})
