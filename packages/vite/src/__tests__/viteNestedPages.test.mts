import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test, after, before, beforeEach, describe, it } from 'node:test'
import { fileURLToPath } from 'url'

import { transformWithEsbuild } from 'vite'

import * as babel from '@babel/core'
import projectConfig from '@redwoodjs/project-config'

import {
  Flags,
  getWebSideDefaultBabelConfig,
} from '@redwoodjs/babel-config'

async function vitePrebuildWebFile(
  srcPath: string,
  flags: Flags = {}
) {
  const code = await transform(srcPath)
  const config = getWebSideDefaultBabelConfig(flags)
  const result = babel.transform(code, {
    ...config,
    cwd: getPaths().web.base,
    filename: srcPath,
  })

  return result
}

async function transform(srcPath: string) {
  const code = fs.readFileSync(srcPath, 'utf-8')

  const transformed = await transformWithEsbuild(code, srcPath, {
    loader: 'jsx',
  })

  return transformed.code
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FIXTURE_PATH = path.join(__dirname, 'fixtures/nestedPages')
const { getPaths } = projectConfig

test('transform', async (t) => {
  t.mock.method(fs, 'readFileSync', () => {
    return '<Router><Route path="/" page={HomePage} name="home" /></Router>'
  })

  t.mock.method(fs, 'existsSync', () => true)

  assert.equal(
    await transform('Router.jsx'),
    '/* @__PURE__ */ React.createElement(Router, null, /* @__PURE__ */ React.createElement(Route, { path: "/", page: HomePage, name: "home" }));\n'
  )
})

describe('User specified imports, with static imports', () => {
  let outputWithStaticImports: string | null | undefined
  let outputNoStaticImports: string | null | undefined

  beforeEach(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
  })

  after(() => {
    delete process.env.RWJS_CWD
  })

  before(async () => {
    process.env.RWJS_CWD = FIXTURE_PATH

    const routesFile = getPaths().web.routes
    const prerenderResult = await vitePrebuildWebFile(routesFile, {
      prerender: true,
      forJest: true,
      forVite: true,
    })
    outputWithStaticImports = prerenderResult?.code

    const buildResult = await vitePrebuildWebFile(routesFile, {
      forJest: true,
      forVite: true,
    })
    outputNoStaticImports = buildResult?.code
  })

  it('Imports layouts correctly', () => {
    // Note avoid checking the full require path because windows paths have unusual slashes
    expect(outputWithStaticImports).toContain('import AdminLayout from "')
    expect(outputWithStaticImports).toContain('import MainLayout from "')

    expect(outputNoStaticImports).toContain('import AdminLayout from "')
    expect(outputNoStaticImports).toContain('import MainLayout from "')
  })

  describe('pages without explicit import', () => {
    describe('static prerender imports', () => {
      it('Adds loaders for non-nested pages', () => {
        expect(outputWithStaticImports).toContain(
          `const LoginPage = {
  name: "LoginPage",
  prerenderLoader: name => require("./pages/LoginPage/LoginPage"),
  LazyComponent: lazy(() => import( /* webpackChunkName: "LoginPage" */"./pages/LoginPage/LoginPage"))
}`
        )

        expect(outputWithStaticImports).toContain(
          `const HomePage = {
  name: "HomePage",
  prerenderLoader: name => require("./pages/HomePage/HomePage"),
  LazyComponent: lazy(() => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"))
}`
        )
      })
    })

    describe('dynamic build imports', () => {
      it('Adds loaders for non-nested pages that reads from globalThis in prerenderLoader', () => {
        expect(outputNoStaticImports).toContain(
          `const LoginPage = {
  name: "LoginPage",
  prerenderLoader: name => ({
    default: globalThis.__REDWOOD__PRERENDER_PAGES[name]
  }),
  LazyComponent: lazy(() => import( /* webpackChunkName: "LoginPage" */"./pages/LoginPage/LoginPage"))
}`
        )

        expect(outputNoStaticImports).toContain(
          `const HomePage = {
  name: "HomePage",
  prerenderLoader: name => ({
    default: globalThis.__REDWOOD__PRERENDER_PAGES[name]
  }),
  LazyComponent: lazy(() => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"))
}`
        )
      })
    })
  })

  describe('pages with explicit import', () => {
    describe('static prerender imports', () => {
      it('Uses the user specified name for nested page', () => {
        // Import statement: import NewJobPage from 'src/pages/Jobs/NewJobPage'
        expect(outputWithStaticImports).toContain(
          `const NewJobPage = {
  name: "NewJobPage",
  prerenderLoader: name => require("./pages/Jobs/NewJobPage/NewJobPage"),
  LazyComponent: lazy(() => import( /* webpackChunkName: "NewJobPage" */"./pages/Jobs/NewJobPage/NewJobPage"))
}`
        )
      })

      it('Uses the user specified custom default export import name for nested page', () => {
        // Import statement: import BazingaJobProfilePageWithFunnyName from 'src/pages/Jobs/JobProfilePage'
        expect(outputWithStaticImports).toContain(
          `const BazingaJobProfilePageWithFunnyName = {
  name: "BazingaJobProfilePageWithFunnyName",
  prerenderLoader: name => require("./pages/Jobs/JobProfilePage/JobProfilePage"),
  LazyComponent: lazy(() => import( /* webpackChunkName: "BazingaJobProfilePageWithFunnyName" */"./pages/Jobs/JobProfilePage/JobProfilePage"))
}`
        )
      })

      it('Removes explicit imports when prerendering', () => {
        expect(outputWithStaticImports).not.toContain(
          `var _NewJobPage = _interopRequireDefault`
        )

        expect(outputWithStaticImports).not.toContain(
          `var _JobProfilePage = _interopRequireDefault`
        )
      })

      it('Keeps using the user specified name when generating React component', () => {
        // Generate react component still uses the user specified name
        expect(outputWithStaticImports).toContain(`React.createElement(Route, {
    path: "/job-profiles/{id:Int}",
    page: BazingaJobProfilePageWithFunnyName,
    name: "jobProfile"
  })`)
      })
    })

    describe('dynamic build imports', () => {
      it('Directly uses the import when page is explicitly imported', () => {
        // Explicit import uses the specified import
        // Has statement: import BazingaJobProfilePageWithFunnyName from 'src/pages/Jobs/JobProfilePage'
        // The name of the import is not important without static imports
        // Webpack will generate a name. Vite will use the name in the import statement
        expect(outputNoStaticImports).toContain(`React.createElement(Route, {
    path: "/job-profiles/{id:Int}",
    page: BazingaJobProfilePageWithFunnyName,
    name: "jobProfile"
  })`)
      })

      it("Uses the LazyComponent for a page that isn't imported", () => {
        expect(outputNoStaticImports).toContain(`const HomePage = {
  name: "HomePage",
  prerenderLoader: name => ({
    default: globalThis.__REDWOOD__PRERENDER_PAGES[name]
  }),
  LazyComponent: lazy(() => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"))
}`)
        expect(outputNoStaticImports).toContain(`React.createElement(Route, {
    path: "/",
    page: HomePage,
    name: "home"
  })`)
      })

      it('Should NOT add a LazyComponent for pages that have been explicitly loaded', () => {
        expect(outputNoStaticImports).not.toContain(`const JobsJobPage = {
  name: "JobsJobPage"`)

        expect(outputNoStaticImports).not.toContain(`const JobsNewJobPage = {
  name: "JobsNewJobPage"`)

        expect(outputNoStaticImports).toContain(`React.createElement(Route, {
    path: "/jobs",
    page: JobsPage,
    name: "jobs"
  })`)
      })
    })
  })

  it('Handles when imports from a page include non-default imports too', () => {
     // Because we import import EditJobPage, 👉 { NonDefaultExport } from 'src/pages/Jobs/EditJobPage'

     expect(outputWithStaticImports).toContain(
      'import { NonDefaultExport } from "'
    )

    expect(outputWithStaticImports).toContain(`const EditJobPage = {
  name: "EditJobPage",
  prerenderLoader: name => require("./pages/Jobs/EditJobPage/EditJobPage"),
  LazyComponent: lazy(() => import( /* webpackChunkName: "EditJobPage" */"./pages/Jobs/EditJobPage/EditJobPage"))
}`)

    expect(outputNoStaticImports).toContain(
      'import EditJobPage, { NonDefaultExport } from "'
    )

    expect(outputNoStaticImports).toContain(`React.createElement(Route, {
    path: "/jobs/{id:Int}/edit",
    page: EditJobPage,
    name: "editJob"`)

    // Should not generate a loader, because page was explicitly imported
    expect(outputNoStaticImports).not.toMatch(
      /import\(.*"\.\/pages\/Jobs\/EditJobPage\/EditJobPage"\)/
    )
  })
})

function expect(str) {
  return {
    toContain: (sub) => {
      assert.equal(str.includes(sub), true, `Expected ${str} to contain ${sub}`)
    },
    not: {
      toContain: (sub) => {
        assert.equal(
          str.includes(sub),
          false,
          `Expected ${str} to not contain ${sub}`
        )
      },
      toMatch: (regex) => {
        assert.equal(
          regex.test(str),
          false,
          `Expected ${str} to not match ${regex}`
        )
      },
    },
  }
}
