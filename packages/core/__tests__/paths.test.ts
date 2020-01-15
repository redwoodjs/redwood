import path from 'path'

import { processPagesDir } from '../src/main'

describe('paths', () => {
  describe('processPagesDir', () => {
    it('it accurately finds the pages', () => {
      const deps = processPagesDir(
        path.resolve(__dirname, '../__mocks__/pages/')
      )
      expect(deps[0].const).toEqual('AdminMargleTheWorld')
      expect(deps[1].const).toEqual('HelloWorld')
    })
  })
})
