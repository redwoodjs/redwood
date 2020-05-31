import path from 'path'

import { processPagesDir, resolveFile } from '../paths'

describe('paths', () => {
  describe('processPagesDir', () => {
    it('it accurately finds the pages', () => {
      const deps = processPagesDir(
        path.resolve(__dirname, './fixtures/web/pages/')
      )
      expect(deps).toMatchInlineSnapshot(`
        Array [
          Object {
            "const": "AdminMargleTheWorld",
            "importName": "AdminMargleTheWorld",
            "importPath": "src/pages/Admin/MargleTheWorld",
            "importStatement": "const AdminMargleTheWorld = { name: 'AdminMargleTheWorld', loader: () => import('src/pages/Admin/MargleTheWorld') }",
            "path": "/Users/peterp/x/redwoodjs/redwood/packages/internal/src/__tests__/fixtures/web/pages/Admin/MargleTheWorld",
          },
          Object {
            "const": "HelloWorld",
            "importName": "HelloWorld",
            "importPath": "src/pages/HelloWorld",
            "importStatement": "const HelloWorld = { name: 'HelloWorld', loader: () => import('src/pages/HelloWorld') }",
            "path": "/Users/peterp/x/redwoodjs/redwood/packages/internal/src/__tests__/fixtures/web/pages/HelloWorld",
          },
        ]
      `)
    })
  })

  describe('resolveFile', () => {
    const p = resolveFile(path.join(__dirname, './fixtures/api/test/test'))
    expect(path.extname(p)).toEqual('.ts')
  })
})
