import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'

import { getPaths } from '@redwoodjs/project-config'

import babelRoutesAutoLoader from '../babel-plugin-redwood-routes-auto-loader'
import type { PluginOptions as RoutesAutoLoaderOptions } from '../babel-plugin-redwood-routes-auto-loader'

const transform = (
  filename: string,
  pluginOptions?: RoutesAutoLoaderOptions
) => {
  const code = fs.readFileSync(filename, 'utf-8')
  return babel.transform(code, {
    filename,
    presets: ['@babel/preset-react'],
    plugins: [[babelRoutesAutoLoader, pluginOptions]],
  })
}

describe('mulitiple files ending in Page.{js,jsx,ts,tsx}', () => {
  const FAILURE_FIXTURE_PATH = path.resolve(
    __dirname,
    './__fixtures__/route-auto-loader/failure'
  )

  beforeAll(() => {
    process.env.RWJS_CWD = FAILURE_FIXTURE_PATH
  })

  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  test('Fails with appropriate message', () => {
    expect(() => {
      transform(getPaths().web.routes)
    }).toThrowError(
      "Unable to find only a single file ending in 'Page.{js,jsx,ts,tsx}' in the follow page directories: 'HomePage"
    )
  })
})

describe('page auto loader correctly imports pages', () => {
  const FIXTURE_PATH = path.resolve(
    __dirname,
    '../../../../../__fixtures__/example-todo-main/'
  )

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

  test('RSC specific code should not be added', () => {
    expect(result?.code).not.toContain(
      'import { renderFromRscServer } from "@redwoodjs/vite/client"'
    )
  })
})

describe('page auto loader handles imports for RSC', () => {
  const FIXTURE_PATH = path.resolve(
    __dirname,
    '../../../../../__fixtures__/example-todo-main/'
  )

  let result: babel.BabelFileResult | null

  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
    result = transform(getPaths().web.routes, { forRscClient: true })
  })

  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  test('Pages are loaded with renderFromRscServer', () => {
    const codeOutput = result?.code
    expect(codeOutput).not.toContain(`const HomePage = {
  name: "HomePage",
  prerenderLoader: name => __webpack_require__(require.resolveWeak("./pages/HomePage/HomePage")),
  LazyComponent: lazy(() => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"))
`)

    expect(codeOutput).toContain(
      'import { renderFromRscServer } from "@redwoodjs/vite/client"'
    )

    expect(codeOutput).toContain(
      'const HomePage = renderFromRscServer("HomePage")'
    )

    // Un-imported pages get added with renderFromRscServer
    // so it calls the RSC worker to get a flight response
    expect(codeOutput).toContain(
      'const HomePage = renderFromRscServer("HomePage")'
    )
    expect(codeOutput).toContain(
      'const BarPage = renderFromRscServer("BarPage")'
    )
  })

  // Not sure about this 👇 - what should the behavior be?
  test('Already imported pages are left alone.', () => {
    expect(result?.code).toContain(`import FooPage from 'src/pages/FooPage'`)
  })
})
