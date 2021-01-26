import path from 'path'

import { processPagesDir, resolveFile, ensurePosixPath } from '../paths'

describe('paths', () => {
  describe('processPagesDir', () => {
    it('it accurately finds the pages', () => {
      const pagesDir = path.resolve(
        __dirname,
        '../../../../__fixtures__/example-todo-main/web/src/pages'
      )

      const pages = processPagesDir(pagesDir)
      expect(pages[0].importPath).toEqual(
        path.join(pagesDir, 'admin/EditUserPage/EditUserPage')
      )
      expect(pages[1].importPath).toEqual(
        path.join(pagesDir, 'FatalErrorPage/FatalErrorPage')
      )
      expect(pages[2].importPath).toEqual(
        path.join(pagesDir, 'HomePage/HomePage')
      )
      expect(pages[3].importPath).toEqual(
        path.join(pagesDir, 'NotFoundPage/NotFoundPage')
      )
      expect(pages[4].importPath).toEqual(
        path.join(pagesDir, 'TypeScriptPage/TypeScriptPage')
      )
    })
  })

  describe('resolveFile', () => {
    const p = resolveFile(path.join(__dirname, './fixtures/api/test/test'))
    expect(path.extname(p)).toEqual('.ts')
  })

  describe('ensurePosixPath', () => {
    it('Returns unmodified input if not on Windows', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'NotWindows',
      })

      const testPath = 'X:\\some\\weird\\path'
      const posixPath = ensurePosixPath(testPath)

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      })

      expect(posixPath).toEqual(testPath)
    })

    it('Transforms paths on Windows', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })

      const testPath = '..\\some\\relative\\path'
      const posixPath = ensurePosixPath(testPath)

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      })

      expect(posixPath).toEqual('../some/relative/path')
    })

    it('Handles drive letters', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })

      const testPath = 'C:\\some\\full\\path\\to\\file.ext'
      const posixPath = ensurePosixPath(testPath)

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      })

      expect(posixPath).toEqual('/c/some/full/path/to/file.ext')
    })
  })
})
