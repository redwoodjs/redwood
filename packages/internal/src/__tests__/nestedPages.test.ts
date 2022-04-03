import path from 'path'

import { prebuildWebFile } from '../build/babel/web'
import { cleanWebBuild } from '../build/web'
import { getPaths } from '../paths'

const FIXTURE_PATH = path.join(__dirname, 'fixtures/nestedPages')

describe('User specified imports, with static imports', () => {
  let outputWithStaticImports
  let outputNoStaticImports
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
    }).code

    outputNoStaticImports = prebuildWebFile(routesFile, {
      forJest: true,
    }).code
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

  it('Adds loaders for non-nested pages, that do not have an explicit import', () => {
    // Static import for prerender
    expect(outputWithStaticImports).toContain(
      `const LoginPage = {
  name: "LoginPage",
  loader: () => require("./pages/LoginPage/LoginPage")
}`
    )

    expect(outputWithStaticImports).toContain(
      `const HomePage = {
  name: "HomePage",
  loader: () => require("./pages/HomePage/HomePage")
}`
    )

    // Dynamic import for build
    expect(outputNoStaticImports).toContain(
      `const LoginPage = {
  name: "LoginPage",
  loader: () => import("./pages/LoginPage/LoginPage")
}`
    )

    expect(outputNoStaticImports).toContain(
      `const HomePage = {
  name: "HomePage",
  loader: () => import("./pages/HomePage/HomePage")
}`
    )
  })

  it('[static imports] Loader for imported nested page uses user specified name', () => {
    // Import statement: import JobsPage from 'src/pages/Jobs/JobsPage'
    expect(outputWithStaticImports).toContain(
      `const NewJobPage = {
  name: "NewJobPage",
  loader: () => require("./pages/Jobs/NewJobPage/NewJobPage")
}`
    )

    // Import statement is this: import BazingaJobProfilePageWithFunnyName from 'src/pages/Jobs/JobProfilePage'
    expect(outputWithStaticImports).toContain(
      `const BazingaJobProfilePageWithFunnyName = {
  name: "BazingaJobProfilePageWithFunnyName",
  loader: () => require("./pages/Jobs/JobProfilePage/JobProfilePage")
}`
    )

    // Check that the explicitly imported nested pages are removed too
    expect(outputWithStaticImports).not.toContain(
      `var _NewJobPage = _interopRequireDefault`
    )

    expect(outputWithStaticImports).not.toContain(
      `var _JobProfilePage = _interopRequireDefault`
    )

    // Generate react component still uses the user specified name
    expect(outputWithStaticImports).toContain(`.createElement(_router.Route, {
    path: "/job-profiles/{id:Int}",
    page: BazingaJobProfilePageWithFunnyName,
    name: "jobProfile"
  })`)
  })

  it('[no static import] Directly uses the import when page is explicitly imported', () => {
    // Explicit import uses the specified import
    // Has statement: import BazingaJobProfilePageWithFunnyName from 'src/pages/Jobs/JobProfilePage'
    // The name of the import is not important without static imports
    expect(outputNoStaticImports).toContain(`.createElement(_router.Route, {
    path: "/job-profiles/{id:Int}",
    page: _JobProfilePage["default"],
    name: "jobProfile"
  })`)

    // Uses the loader for a page that isn't imported
    expect(outputNoStaticImports).toContain(`const HomePage = {
  name: "HomePage",
  loader: () => import("./pages/HomePage/HomePage")
}`)
    expect(outputNoStaticImports).toContain(`.createElement(_router.Route, {
    path: "/",
    page: HomePage,
    name: "home"
  })`)

    // Should NOT add a loader for pages that have been explicitly loaded
    expect(outputNoStaticImports).not.toContain(`const JobsJobPage = {
  name: "JobsJobPage",
  loader: () => import("./pages/Jobs/JobsPage/JobsPage")
}`)

    expect(outputNoStaticImports).not.toContain(`const JobsNewJobPage = {
  name: "JobsNewJobPage",
  loader: () => import("./pages/Jobs/NewJobPage/NewJobPage")
}`)

    expect(outputNoStaticImports).toContain(`.createElement(_router.Route, {
    path: "/jobs",
    page: _JobsPage["default"],
    name: "jobs"
  })`)
  })

  it('Handles when imports from a page include non-default imports too', () => {
    // Because we import import EditJobPage, 👉 { NonDefaultExport } from 'src/pages/Jobs/EditJobPage'

    expect(outputWithStaticImports).toContain('var _EditJobPage = require("')
    expect(outputWithStaticImports).toContain(`const EditJobPage = {
  name: "EditJobPage",
  loader: () => require("./pages/Jobs/EditJobPage/EditJobPage")
}`)

    expect(outputNoStaticImports).toContain(
      'var _EditJobPage = _interopRequireWildcard('
    )
    expect(outputNoStaticImports).toContain(`.createElement(_router.Route, {
    path: "/jobs/{id:Int}/edit",
    page: _EditJobPage["default"],
    name: "editJob"`)

    // Should not generate a loader, because page was explicitly imported
    expect(outputNoStaticImports).not.toContain(
      `loader: () => import("./pages/Jobs/EditJobPage/EditJobPage")`
    )
  })
})
