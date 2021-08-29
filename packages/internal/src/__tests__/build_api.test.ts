import fs from 'fs'
import path from 'path'

import {
  prebuildApiFiles,
  cleanApiBuild,
  generateProxyFilesForNestedFunction,
} from '../build/api'
import { getApiSideBabelConfigPath } from '../build/babel/api'
import { findApiFiles } from '../files'
import { ensurePosixPath } from '../paths'

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

test('api prebuild uses babel config', () => {
  const p = prebuiltFiles.filter((p) => p.endsWith('dog.js')).pop()

  const code = fs.readFileSync(p, 'utf-8')
  const firstLine = stripInlineSourceMap(code).split('\n')[0]
  expect(firstLine).toEqual('import dog from "dog-bless";')
})

test('Pretranspile polyfills unsupported functionality', () => {
  const p = prebuiltFiles.filter((p) => p.endsWith('polyfill.js')).pop()
  const code = fs.readFileSync(p, 'utf-8')
  const firstLine = stripInlineSourceMap(code).split('\n')[0]
  expect(firstLine).toEqual(
    `import "core-js/modules/esnext.string.replace-all.js";`
  )
})

function stripInlineSourceMap(src: string): string {
  return src
    .split('\n')
    .filter((line) => !line.startsWith('//# sourceMappingURL='))
    .join('\n')
}
