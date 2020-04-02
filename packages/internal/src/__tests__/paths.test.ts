import MockProject from '@redwoodjs/test-mocks'

import { getPaths, getSidePaths } from '../paths'

describe('paths', () => {
  const mockrw = new MockProject()

  beforeEach(() => {
    mockrw.mock()
  })

  afterAll(() => {
    mockrw.restore()
  })

  describe('getPaths', () => {
    it('provides defaults based off an empty configuration', () => {
      const paths = getPaths()
      mockrw.restore()
      expect(paths).toMatchSnapshot()
    })
  })

  describe('getSidePaths', () => {
    it('returns the correct paths for the given side', () => {
      const web = getSidePaths('web')
      mockrw.restore()
      expect(web).toMatchSnapshot()
    })

    it('throws when the side is incorrect', () => {
      expect(() => getSidePaths('banana')).toThrow()
    })
  })
})
