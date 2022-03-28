import path from 'path'

import { prebuildWebFile } from '../build/babel/web'
import { prebuildWebFiles, cleanWebBuild } from '../build/web'
import { findWebFiles } from '../files'
import { ensurePosixPath, getPaths } from '../paths'

const FIXTURE_PATH = path.join(__dirname, 'fixtures/nestedPages')

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

describe('User specified imports, with static imports', () => {
  let outputWithStaticImports
  let webSrcDir
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
    webSrcDir = getPaths().web.src
  })

  it('Imports layouts correctly', () => {
    expect(outputWithStaticImports).toContain(
      `var _AdminLayout = _interopRequireDefault(require("${webSrcDir}/layouts/AdminLayout/AdminLayout"))`
    )
    expect(outputWithStaticImports).toContain(
      `var _MainLayout = _interopRequireDefault(require("${webSrcDir}/layouts/MainLayout/MainLayout"))`
    )
  })

  it('Adds loaders for non-nested pages, that do not have an explicit import', () => {
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
  })

  it('Loads for imported nested page uses user specified name', () => {
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
})
