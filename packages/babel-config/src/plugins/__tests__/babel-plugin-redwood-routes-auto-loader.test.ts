import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'

import { getPaths } from '@redwoodjs/project-config'

import babelRoutesAutoLoader from '../babel-plugin-redwood-routes-auto-loader'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../../__fixtures__/example-todo-main/'
)

const transform = (filename: string) => {
  const code = fs.readFileSync(filename, 'utf-8')
  return babel.transform(code, {
    filename,
    presets: ['@babel/preset-react'],
    plugins: [babelRoutesAutoLoader],
  })
}

describe('page auto loader correctly imports pages', () => {
  let result: babel.BabelFileResult | null

  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
    result = transform(getPaths().web.routes)
  })

  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  test('Pages get both a LazyComponent and a prerenderLoader', () => {
    expect(result?.code).toContain(`const HomePage = {
  name: "HomePage",
  prerenderLoader: name => __webpack_require__(require.resolveWeak("./pages/HomePage/HomePage")),
  LazyComponent: lazy(() => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"))
`)
  })

  test('Already imported pages are left alone.', () => {
    expect(result?.code).toContain(`import FooPage from 'src/pages/FooPage'`)
  })
})
