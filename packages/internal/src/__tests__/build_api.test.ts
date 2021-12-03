import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'

import {
  prebuildApiFiles,
  cleanApiBuild,
  generateProxyFilesForNestedFunction,
} from '../build/api'
import {
  getApiSideBabelConfigPath,
  getApiSideBabelPlugins,
  getApiSideDefaultBabelConfig,
} from '../build/babel/api'
import { findApiFiles } from '../files'
import { ensurePosixPath, getPaths } from '../paths'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

const fullPath = (p) => {
  return path.join(FIXTURE_PATH, p)
}

// Fixtures, filled in beforeAll
let prebuiltFiles
let relativePaths

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
  cleanApiBuild()

  const apiFiles = findApiFiles()
  prebuiltFiles = prebuildApiFiles(apiFiles)

  relativePaths = prebuiltFiles
    .filter((x) => typeof x !== 'undefined')
    .map(cleanPaths)
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('api files are prebuilt', () => {
  // Builds non-nested functions
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/functions/graphql.js'
  )

  // Builds graphql folder
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/graphql/todos.sdl.js'
  )

  // Builds nested function
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/functions/nested/nested.js'
  )
})

describe("Should create a 'proxy' function for nested functions", () => {
  it('Handles functions nested with the same name', () => {
    const [buildPath, reExportPath] = generateProxyFilesForNestedFunction(
      fullPath('.redwood/prebuild/api/src/functions/nested/nested.js')
    )

    // Hidden path in the _nestedFunctions folder
    expect(cleanPaths(buildPath)).toBe(
      '.redwood/prebuild/api/src/_nestedFunctions/nested/nested.js'
    )

    // Proxy/reExport function placed in the function directory
    expect(cleanPaths(reExportPath)).toBe(
      '.redwood/prebuild/api/src/functions/nested.js'
    )

    const reExportContent = fs.readFileSync(reExportPath, 'utf-8')
    expect(reExportContent).toMatchInlineSnapshot(
      `"export * from '../_nestedFunctions/nested/nested';"`
    )
  })

  it('Handles folders with an index file', () => {
    const [buildPath, reExportPath] = generateProxyFilesForNestedFunction(
      fullPath('.redwood/prebuild/api/src/functions/x/index.js')
    )

    // Hidden path in the _build folder
    expect(cleanPaths(buildPath)).toBe(
      '.redwood/prebuild/api/src/_nestedFunctions/x/index.js'
    )

    // Proxy/reExport function placed in the function directory
    expect(cleanPaths(reExportPath)).toBe(
      '.redwood/prebuild/api/src/functions/x.js'
    )

    const reExportContent = fs.readFileSync(reExportPath, 'utf-8')

    expect(reExportContent).toMatchInlineSnapshot(
      `"export * from '../_nestedFunctions/x';"`
    )
  })

  it('Should not put files that dont match the folder name in dist/functions', () => {
    const [buildPath, reExportPath] = generateProxyFilesForNestedFunction(
      fullPath('.redwood/prebuild/api/src/functions/invalid/x.js')
    )

    // File is transpiled to the _nestedFunctions folder
    expect(cleanPaths(buildPath)).toEqual(
      '.redwood/prebuild/api/src/_nestedFunctions/invalid/x.js'
    )

    // But not exposed as a serverless function
    expect(reExportPath).toBe(undefined)
  })
})

test('api prebuild finds babel.config.js', () => {
  let p = getApiSideBabelConfigPath()
  p = cleanPaths(p)
  expect(p).toEqual('api/babel.config.js')
})

test('api prebuild uses babel config only from the api side root', () => {
  const p = prebuiltFiles.filter((p) => p.endsWith('dog.js')).pop()
  const code = fs.readFileSync(p, 'utf-8')
  expect(code).toContain(`import dog from "dog-bless";`)

  // Should ignore root babel config
  expect(code).not.toContain(`import kitty from "kitty-purr"`)
})

// Still a bit of a mystery why this plugin isn't transforming gql tags
test.skip('api prebuild transforms gql with `babel-plugin-graphql-tag`', () => {
  // babel-plugin-graphql-tag should transpile the "gql" parts of our files,
  // achieving the following:
  // 1. removing the `graphql-tag` import
  // 2. convert the gql syntax into graphql's ast.
  //
  // https://www.npmjs.com/package/babel-plugin-graphql-tag
  const builtFiles = prebuildApiFiles(findApiFiles())
  const p = builtFiles
    .filter((x) => typeof x !== 'undefined')
    .filter((p) => p.endsWith('todos.sdl.js'))
    .pop()

  const code = fs.readFileSync(p, 'utf-8')
  expect(code.includes('import gql from "graphql-tag";')).toEqual(false)
  expect(code.includes('gql`')).toEqual(false)
})

test('Pretranspile polyfills unsupported functionality', () => {
  const p = prebuiltFiles.filter((p) => p.endsWith('polyfill.js')).pop()
  const code = fs.readFileSync(p, 'utf-8')
  expect(code).toContain(
    'import _replaceAllInstanceProperty from "@babel/runtime-corejs3/core-js/instance/replace-all"'
  )
})

test('Pretranspile uses corejs3 aliasing', () => {
  // See https://babeljs.io/docs/en/babel-plugin-transform-runtime#core-js-aliasing
  // This is because we configure the transform runtime plugin corejs

  const p = prebuiltFiles.filter((p) => p.endsWith('transform.js')).pop()
  const code = fs.readFileSync(p, 'utf-8')

  // Polyfill for Symbol
  expect(code).toContain(
    `import _Symbol from "@babel/runtime-corejs3/core-js/symbol"`
  )

  // Polyfill for Promise
  expect(code).toContain(
    `import _Promise from "@babel/runtime-corejs3/core-js/promise"`
  )

  // Polyfill for .includes
  expect(code).toContain(
    'import _includesInstanceProperty from "@babel/runtime-corejs3/core-js/instance/includes"'
  )

  // Polyfill for .iterator
  expect(code).toContain(
    `import _getIterator from "@babel/runtime-corejs3/core-js/get-iterator"`
  )
})

test('jest mock statements also handle', () => {
  const pathToTest = path.join(getPaths().api.services, 'todos/todos.test.js')

  const code = fs.readFileSync(pathToTest, 'utf-8')

  const defaultOptions = getApiSideDefaultBabelConfig()

  // Step 1: prebuild service/todos.test.js
  const outputForJest = babel.transform(code, {
    ...defaultOptions,
    filename: pathToTest,
    cwd: getPaths().api.base,
    // We override the plugins, to match packages/testing/config/jest/api/index.js
    plugins: getApiSideBabelPlugins({ forJest: true }),
  }).code

  // Step 2: check that output has correct import statement path
  expect(outputForJest).toContain('import dog from "../../lib/dog"')
  // Step 3: check that output has correct jest.mock path
  expect(outputForJest).toContain('jest.mock("../../lib/dog"')
})
