import path from 'path'

import { prebuildWebFile } from '../build/babel/web'
import { prebuildWebFiles, cleanWebBuild } from '../build/web'
import { findWebFiles } from '../files'
import { ensurePosixPath, getPaths } from '../paths'

const FIXTURE_PATH = path.resolve(__dirname, 'fixtures/nestedPages')

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

beforeEach(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
  cleanWebBuild()
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('Check routes are imported with require when staticImports flag is enabled', () => {
  const routesFile = getPaths().web.routes

  const withStaticImports = prebuildWebFile(routesFile, {
    staticImports: true,
  }).code //?

  /* Check that imports have the form
   `const HomePage = {
     name: "HomePage",
     loader: () => require("` 👈 Uses a require statement
     */
  expect(withStaticImports).toContain(`const HomePage = {`)
  expect(withStaticImports).toContain(`const BarPage = {`)

  /*
    👇 Foo page is an explicitly imported page in the source
    const FooPage = {
      name: "FooPage",
      loader: () => require(
    */
  expect(withStaticImports).toContain(`const FooPage = {`)
  expect(withStaticImports).not.toContain(
    `var _FooPage = _interopRequireDefault(require(`
  )
})

test('Check routes are imported with "import" when staticImports flag is NOT passed', () => {
  const routesFile = getPaths().web.routes

  const withoutStaticImports = prebuildWebFile(routesFile).code

  /* Check that imports have the form
   `const HomePage = {
     name: "HomePage",
     loader: () => import("` 👈 Uses an (async) import statement
     */

  expect(withoutStaticImports).toContain(`const HomePage = {`)
  expect(withoutStaticImports).toContain(`const BarPage = {`)

  /*
    👇 Foo page is an explicitly imported page, so it should
    var _FooPage = _interopRequireDefault(require(\\"./pages/FooPage/FooPage\\"))
    (inverse of the static imports one)
    .
    .
    .
    page: _FooPage[\\"default\\"],
  */
  expect(withoutStaticImports).not.toContain(`const FooPage = {`)
  expect(withoutStaticImports).toContain(
    `var _FooPage = _interopRequireDefault(require(`
  )
})
