import path from 'path'

import { getPaths } from '@redwoodjs/project-config'

import { prebuildWebFile } from '../build/babel/web'
import { cleanWebBuild } from '../build/web'

const FIXTURE_PATH = path.join(__dirname, 'fixtures/nestedPages')

describe('User specified imports, with static imports', () => {
  let outputWithStaticImports: string | null | undefined
  let outputNoStaticImports: string | null | undefined
  beforeEach(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
    cleanWebBuild()
  })

  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH

    const routesFile = getPaths().web.routes
    outputWithStaticImports = prebuildWebFile(routesFile, {
      staticImports: true,
      forJest: true,
    })?.code

    outputNoStaticImports = prebuildWebFile(routesFile, {
      forJest: true,
    })?.code
  })

  it('Imports layouts correctly', () => {
    // Note avoid checking the full require path because windows paths have unusual slashes
    expect(outputWithStaticImports).toContain(
      `var _AdminLayout = _interopRequireDefault(require("`
    )
    expect(outputWithStaticImports).toContain(
      `var _MainLayout = _interopRequireDefault(require("`
    )

    expect(outputNoStaticImports).toContain(
      `var _AdminLayout = _interopRequireDefault(require("`
    )
    expect(outputNoStaticImports).toContain(
      `var _MainLayout = _interopRequireDefault(require("`
    )
  })

  describe('pages without explicit import', () => {
    describe('static prerender imports', () => {
      it('Adds loaders for non-nested pages', () => {
        expect(outputWithStaticImports).toContain(
          `const LoginPage = {
  name: "LoginPage",
  loader: () => import( /* webpackChunkName: "LoginPage" */"./pages/LoginPage/LoginPage"),
  prerenderLoader: () => require("./pages/LoginPage/LoginPage")
}`
        )

        expect(outputWithStaticImports).toContain(
          `const HomePage = {
  name: "HomePage",
  loader: () => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"),
  prerenderLoader: () => require("./pages/HomePage/HomePage")
}`
        )
      })
    })

    describe('dynamic build imports', () => {
      it('Adds loaders for non-nested pages with __webpack_require__ and require.resolveWeak in prerenderLoader to not bundle the pages', () => {
        expect(outputNoStaticImports).toContain(
          `const LoginPage = {
  name: "LoginPage",
  loader: () => import( /* webpackChunkName: "LoginPage" */"./pages/LoginPage/LoginPage"),
  prerenderLoader: () => __webpack_require__(require.resolveWeak("./pages/LoginPage/LoginPage"))
}`
        )

        expect(outputNoStaticImports).toContain(
          `const HomePage = {
  name: "HomePage",
  loader: () => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"),
  prerenderLoader: () => __webpack_require__(require.resolveWeak("./pages/HomePage/HomePage"))
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
  loader: () => import( /* webpackChunkName: "NewJobPage" */"./pages/Jobs/NewJobPage/NewJobPage"),
  prerenderLoader: () => require("./pages/Jobs/NewJobPage/NewJobPage")
}`
        )
      })

      it('Uses the user specified custom default export import name for nested page', () => {
        // Import statement: import BazingaJobProfilePageWithFunnyName from 'src/pages/Jobs/JobProfilePage'
        expect(outputWithStaticImports).toContain(
          `const BazingaJobProfilePageWithFunnyName = {
  name: "BazingaJobProfilePageWithFunnyName",
  loader: () => import( /* webpackChunkName: "BazingaJobProfilePageWithFunnyName" */"./pages/Jobs/JobProfilePage/JobProfilePage"),
  prerenderLoader: () => require("./pages/Jobs/JobProfilePage/JobProfilePage")
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
        expect(outputWithStaticImports)
          .toContain(`.createElement(_router.Route, {
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
        expect(outputNoStaticImports).toContain(`.createElement(_router.Route, {
    path: "/job-profiles/{id:Int}",
    page: _JobProfilePage["default"],
    name: "jobProfile"
  })`)
      })

      it("Uses the loader for a page that isn't imported", () => {
        expect(outputNoStaticImports).toContain(`const HomePage = {
  name: "HomePage",
  loader: () => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"),
  prerenderLoader: () => __webpack_require__(require.resolveWeak("./pages/HomePage/HomePage"))
}`)
        expect(outputNoStaticImports).toContain(`.createElement(_router.Route, {
    path: "/",
    page: HomePage,
    name: "home"
  })`)
      })

      it('Should NOT add a loader for pages that have been explicitly loaded', () => {
        expect(outputNoStaticImports).not.toContain(`const JobsJobPage = {
  name: "JobsJobPage",
  loader: () => import( /* webpackChunkName: "JobsJobPage" */"./pages/Jobs/JobsPage/JobsPage")`)

        expect(outputNoStaticImports).not.toContain(`const JobsNewJobPage = {
  name: "JobsNewJobPage",
  loader: () => import( /* webpackChunkName: "JobsNewJobPage" */"./pages/Jobs/NewJobPage/NewJobPage")`)

        expect(outputNoStaticImports).toContain(`.createElement(_router.Route, {
    path: "/jobs",
    page: _JobsPage["default"],
    name: "jobs"
  })`)
      })
    })
  })

  it('Handles when imports from a page include non-default imports too', () => {
    // Because we import import EditJobPage, 👉 { NonDefaultExport } from 'src/pages/Jobs/EditJobPage'

    expect(outputWithStaticImports).toContain('var _EditJobPage = require("')

    expect(outputWithStaticImports).toContain(`const EditJobPage = {
  name: "EditJobPage",
  loader: () => import( /* webpackChunkName: "EditJobPage" */"./pages/Jobs/EditJobPage/EditJobPage"),
  prerenderLoader: () => require("./pages/Jobs/EditJobPage/EditJobPage")
}`)

    expect(outputNoStaticImports).toContain(
      'var _EditJobPage = _interopRequireWildcard('
    )

    expect(outputNoStaticImports).toContain(`.createElement(_router.Route, {
    path: "/jobs/{id:Int}/edit",
    page: _EditJobPage["default"],
    name: "editJob"`)

    // Should not generate a loader, because page was explicitly imported
    expect(outputNoStaticImports).not.toMatch(
      /loader: \(\) => import\(.*"\.\/pages\/Jobs\/EditJobPage\/EditJobPage"\)/
    )
  })
})
