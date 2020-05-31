import path from 'path'

import { processPagesDir, resolveFile } from '../paths'

describe('paths', () => {
  describe('processPagesDir', () => {
    it('it accurately finds the pages', () => {
      const pagesDir = path.resolve(__dirname, './fixtures/web/src/pages')

      const pages = processPagesDir(pagesDir)
      expect(pages[0].importPath).toEqual(
        path.join(pagesDir, 'Admin/MargleTheWorld/MargleTheWorld')
      )
      expect(pages[1].importPath).toEqual(
        path.join(pagesDir, 'HelloWorld/HelloWorld')
      )
    })
  })

  describe('resolveFile', () => {
    const p = resolveFile(path.join(__dirname, './fixtures/api/test/test'))
    expect(path.extname(p)).toEqual('.ts')
  })
})
