import path from 'path'

import { processPagesDir, resolveFile } from '../paths'

describe('paths', () => {
  describe('processPagesDir', () => {
    it('it accurately finds the pages', () => {
      const pages = processPagesDir(
        path.resolve(__dirname, './fixtures/web/pages/')
      )
      expect(pages[0].importPath).toEqual('src/pages/Admin/MargleTheWorld')
      expect(pages[1].importPath).toEqual('src/pages/HelloWorld')
    })
  })

  describe('resolveFile', () => {
    const p = resolveFile(path.join(__dirname, './fixtures/api/test/test'))
    expect(path.extname(p)).toEqual('.ts')
  })
})
