import { resolve } from 'path'

import { runPrerender } from './../runPrerender'

jest.mock('@redwoodjs/internal', () => {
  const path = require('path')

  return {
    getPaths: jest.fn(() => {
      // __dirname not available
      const __dirname = path.resolve()
      const MOCK_BASE_WEB_DIR = path.join(
        __dirname,
        '../../__fixtures__/example-todo-prerender',
        'web'
      )

      const MOCK_WEB_SRC = path.join(MOCK_BASE_WEB_DIR, 'src')
      const MOCK_WEB_DIST = path.join(MOCK_BASE_WEB_DIR, 'dist')
      const MOCK_ROUTES = path.join(MOCK_BASE_WEB_DIR, 'src', 'Routes.js')

      return {
        web: {
          base: MOCK_BASE_WEB_DIR,
          src: MOCK_WEB_SRC,
          dist: MOCK_WEB_DIST,
          routes: MOCK_ROUTES,
        },
      }
    }),
    getConfig: () => {
      return {
        web: {},
        api: {},
      }
    },
    processPagesDir: jest.fn(() => []),
  }
})

describe('Should prerender typical pages', () => {
  it('handles basic component', async () => {
    const htmlOutput = await runPrerender({
      inputComponentPath: resolve(
        '../../__fixtures__/example-todo-prerender/web/src/pages/TestPage/TestPage.js'
      ),
      outputHtmlPath: '',
      dryRun: true,
    })

    // @HELP!
    // Why doesn't it load the babel presets?

    expect(htmlOutput).toBe('bazinga')
  })
})
