import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'

import { getPaths } from '@redwoodjs/project-config'

import { redwoodRoutesAutoLoaderRscClientPlugin } from '../babel-plugin-redwood-routes-auto-loader-rsc-client'

const transform = (filename: string) => {
  const code = fs.readFileSync(filename, 'utf-8')
  return babel.transform(code, {
    filename,
    presets: ['@babel/preset-react'],
    plugins: [[redwoodRoutesAutoLoaderRscClientPlugin, {}]],
  })
}

describe('injects the correct loading logic', () => {
  const RSC_FIXTURE_PATH = path.resolve(
    __dirname,
    '../../../../../__fixtures__/test-project-rsc-external-packages-and-cells/',
  )
  let result: babel.BabelFileResult | null

  beforeAll(() => {
    process.env.RWJS_CWD = RSC_FIXTURE_PATH
    result = transform(getPaths().web.routes)
  })

  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  test('pages are loaded with renderFromRscServer', () => {
    const codeOutput = result?.code

    // We shouldn't see classic lazy loading like in non-RSC redwood
    expect(codeOutput).not.toContain(`const HomePage = {
  name: "HomePage",
  prerenderLoader: name => __webpack_require__(require.resolveWeak("./pages/HomePage/HomePage")),
  LazyComponent: lazy(() => import( /* webpackChunkName: "HomePage" */"./pages/HomePage/HomePage"))
`)

    // We should import the function
    expect(codeOutput).toContain(
      'import { renderFromRscServer } from "@redwoodjs/vite/client"',
    )

    // Un-imported pages get added with renderFromRscServer
    expect(codeOutput).toContain(
      'const HomePage = renderFromRscServer("HomePage")',
    )
    expect(codeOutput).toContain(
      'const AboutPage = renderFromRscServer("AboutPage")',
    )
    expect(codeOutput).toContain(
      'const UserExampleNewUserExamplePage = renderFromRscServer("UserExampleNewUserExamplePage")',
    )
  })

  test('already imported pages are left alone.', () => {
    expect(result?.code).toContain(
      `import NotFoundPage from './pages/NotFoundPage/NotFoundPage'`,
    )

    expect(result?.code).not.toContain(
      `const NotFoundPage = renderFromRscServer("NotFoundPage")`,
    )
  })
})

describe('mulitiple files ending in Page.{js,jsx,ts,tsx}', () => {
  const FAILURE_FIXTURE_PATH = path.resolve(
    __dirname,
    './__fixtures__/route-auto-loader/failure',
  )

  beforeAll(() => {
    process.env.RWJS_CWD = FAILURE_FIXTURE_PATH
  })

  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  test('fails with appropriate message', () => {
    expect(() => {
      transform(getPaths().web.routes)
    }).toThrow(
      "Unable to find only a single file ending in 'Page.{js,jsx,ts,tsx}' in the follow page directories: 'HomePage",
    )

    expect(() => {
      transform(getPaths().web.routes)
    }).toThrow(
      "Unable to find only a single file ending in 'Page.{js,jsx,ts,tsx}' in the follow page directories: 'HomePage",
    )
  })
})
