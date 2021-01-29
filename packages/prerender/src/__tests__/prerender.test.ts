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
      const MOCK_WEB_SRC_APP = path.join(MOCK_BASE_WEB_DIR, 'src', 'App')
      const MOCK_WEB_DIST = path.join(MOCK_BASE_WEB_DIR, 'dist')
      const MOCK_ROUTES = path.join(MOCK_BASE_WEB_DIR, 'src', 'Routes.js')

      return {
        web: {
          base: MOCK_BASE_WEB_DIR,
          app: MOCK_WEB_SRC_APP,
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

// @MARK: I don't think jest is appropriate for these tests
// Appreciate any suggestions ⬇️
describe.skip('Should prerender typical pages', () => {
  it('handles basic component', async () => {
    const htmlOutput = await runPrerender({
      routerPath: '/test',
      outputHtmlPath: '',
      dryRun: true,
    })

    // @MARK @HELP!
    // Why doesn't it load the babel presets?
    // Fails to parse JSX

    expect(htmlOutput).toBe('bazinga')
  })
})
