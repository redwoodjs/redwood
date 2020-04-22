import path from 'path'

import { processPagesDir, resolveFile } from '../paths'

describe('paths', () => {
  describe('processPagesDir', () => {
    it('it accurately finds the pages', () => {
      const deps = processPagesDir(
        path.resolve(__dirname, './fixtures/web/pages/')
      )
      expect(deps[0].const).toEqual('AdminMargleTheWorld')
      expect(deps[1].const).toEqual('HelloWorld')
    })
  })

  describe('resolveFile', () => {
    const p = resolveFile(path.join(__dirname, './fixtures/api/test/test'))
    expect(path.extname(p)).toEqual('.ts')
  })
})
