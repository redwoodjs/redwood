import mockfs from 'mock-fs'
import merge from 'deepmerge'
import produce from 'immer'

const DEFAULT_PROJECT_PATH = '/mock/project/'
// This is our default `redwood.toml` as defined in our
// `create-redwood-app` repo.
const DEFAULT_CONFIG = `
  [web]
    port = 8910
    apiProxyPath = "/.netlify/functions"
  [api]
    port = 8911
  [browser]
    open = true
  `

const DEFAULT_PATHS = {
  'redwood.toml': DEFAULT_CONFIG,
  api: {
    src: {
      functions: {
        'graphql.js': {},
      },
    },
  },
  web: {
    src: {},
  },
}

// This will mock `findup-sync` which we use to locate the `redwood.toml` file
// in a project.
jest.mock('findup-sync', () => {
  return (): string => `/mock/project/redwood.toml`
})

class MockRedwood {
  paths = DEFAULT_PATHS

  /**
   * Modify a projects paths using an immer draft
   * https://immerjs.github.io/immer/docs/introduction#quick-example
   *
   * @param draftFn(paths, mergeFn)
   * - The `paths` argument are the current paths. Return a
   * modified version of those to update them.
   * @example
   * ```js
   * mockRw.updatePaths((paths, merge) => {
   *   // adds a new page: `/web/src/pages/AboutPage/AboutPage.js`
   *   paths.web.src['pages'] = {
   *     AboutPage: {
   *       'AboutPage.js': '',
   *     },
   *   }
   *   return paths
   *  })
   * ```
   * - The `merge` argument allows you to deepmerge paths with
   * a new object, return that to update paths.
   * @example
   * ```js
   * mockRw.updatePaths((paths, merge) => {
   *   // adds a new AboutPage and HomePage.
   *   return merge(paths, {
   *      web: {
   *        src: {
   *          pages: {
   *            AboutPage: { 'AboutPage.js': '' }
   *            UsersPage: { 'UsersPage.js': '' }
   *          }
   *        }
   *      }
   *  })
   * })
   * ```
   */
  update = (updateFn) => {
    this.paths = produce(this.paths, (currentPaths) => {
      return updateFn(currentPaths, merge)
    })
    this.mock()
  }

  merge = (mergeFn): void => {
    const newPaths = mergeFn()
    this.paths = merge(this.paths, newPaths)
    this.mock()
  }

  mock = (): void => {
    mockfs({ [DEFAULT_PROJECT_PATH]: this.paths })
  }

  restore = (): void => {
    this.paths = DEFAULT_PATHS
    mockfs.restore()
    jest.clearAllMocks()
  }
}

export default MockRedwood
// pages: {
//   HomePage: { 'HomePage.js': '' },
//   AboutPage: { 'AboutPage.js': '' },
//   Admin: { UsersPage: { 'UsersPage.js': '' } },
// }
