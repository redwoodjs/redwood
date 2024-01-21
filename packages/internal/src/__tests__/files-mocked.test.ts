import { vol } from 'memfs'

import { resolveSourcePath } from '../files'

jest.mock('fs', () => require('memfs').fs)

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

describe('test files.ts with mock file system', () => {
  beforeEach(() => {
    vol.reset()
    jest.clearAllMocks()
  })

  afterEach(() => {
    vol.reset()
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe('resolveSourcePath', () => {
    it('resolves script source files without extension', async () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.js': 'export default async ({ args }) => 42 }',
          },
        },
        redwoodProjectPath
      )

      expect(resolveSourcePath('/redwood-app/scripts/foo')).toEqual(
        '/redwood-app/scripts/foo.js'
      )
    })

    it('fails for ambiguos path without extension', async () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.js': 'export default async ({ args }) => 42 }',
            'foo.jsx': 'export default async ({ args }) => 43 }',
          },
        },
        redwoodProjectPath
      )

      expect(resolveSourcePath('/redwood-app/scripts/foo')).toBeFalsy()
    })

    it('fails for path that does not exist without extension', async () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.js': 'export default async ({ args }) => 42 }',
          },
        },
        redwoodProjectPath
      )

      expect(
        resolveSourcePath('/redwood-app/scripts/fooDoesNotExist')
      ).toBeFalsy()
    })

    it('fails for path that does not exist with extension', async () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.js': 'export default async ({ args }) => 42 }',
          },
        },
        redwoodProjectPath
      )

      expect(
        resolveSourcePath('/redwood-app/scripts/fooDoesNotExist.js')
      ).toBeFalsy()
    })

    it('resolves API source files without extension', async () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {
            'foo.js': 'export default async ({ args }) => 42 }',
          },
        },
        redwoodProjectPath
      )

      expect(resolveSourcePath('/redwood-app/api/foo')).toEqual(
        '/redwood-app/api/foo.js'
      )
    })

    it('resolves source files with extensions {js, jsx, ts, tsx}', async () => {
      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          api: {
            'foo.js': 'export default async ({ args }) => 42 }',
            'foo.jsx': 'export default async ({ args }) => 43 }',
            'foo.ts': 'export default async ({ args }) => 44 }',
            'foo.tsx': 'export default async ({ args }) => 45 }',
          },
        },
        redwoodProjectPath
      )

      expect(resolveSourcePath('/redwood-app/api/foo.js')).toEqual(
        '/redwood-app/api/foo.js'
      )
      expect(resolveSourcePath('/redwood-app/api/foo.jsx')).toEqual(
        '/redwood-app/api/foo.jsx'
      )
      expect(resolveSourcePath('/redwood-app/api/foo.ts')).toEqual(
        '/redwood-app/api/foo.ts'
      )
      expect(resolveSourcePath('/redwood-app/api/foo.tsx')).toEqual(
        '/redwood-app/api/foo.tsx'
      )
    })
  })
})
