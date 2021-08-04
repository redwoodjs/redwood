import fs from 'fs'
import path from 'path'

import {
  getApiSideBabelConfigPath,
  prebuildApiFiles,
  getPrebuildOutputOptions,
} from '../build/api'
import { findApiFiles } from '../files'
import { ensurePosixPath } from '../paths'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

// Fixtures, filled in beforeAll
let builtFiles
let prebuildPaths

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
  builtFiles = prebuildApiFiles(findApiFiles())
  prebuildPaths = builtFiles
    .filter((x) => typeof x !== 'undefined')
    .map(cleanPaths)
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('api files are prebuilt', () => {
  expect(prebuildPaths[0].endsWith('api/src/functions/graphql.js')).toBeTruthy()
  expect(prebuildPaths[2].endsWith('api/src/graphql/todos.sdl.js')).toBeTruthy()
})

test('Should prebuild nested functions', () => {
  expect(prebuildPaths).toContain(
    '.redwood/prebuild/api/src/_build/nested/nested.js'
  )

  expect(prebuildPaths).toContain(
    '.redwood/prebuild/api/src/functions/nested.js'
  )
})

describe("Should create a 'proxy' function for nested functions", () => {
  it('Functions with the same name', () => {
    const [buildPath, { reExportPath, reExportContent }] =
      getPrebuildOutputOptions(
        path.join(FIXTURE_PATH, 'api/src/functions/nested/nested.ts')
      )

    // Hidden path in the _build folder
    expect(cleanPaths(buildPath)).toBe(
      '.redwood/prebuild/api/src/_build/nested/nested.js'
    )

    // Proxy/reExport function placed in the function directory
    expect(cleanPaths(reExportPath)).toBe(
      '.redwood/prebuild/api/src/functions/nested.js'
    )

    expect(reExportContent).toMatchInlineSnapshot(
      `"export * from '../_build/nested/nested';"`
    )
  })

  it('Functions with an index file', () => {
    const [buildPath, { reExportPath, reExportContent }] =
      getPrebuildOutputOptions(
        path.join(FIXTURE_PATH, 'api/src/functions/helloWorld/index.ts')
      )

    // Hidden path in the _build folder
    expect(cleanPaths(buildPath)).toBe(
      '.redwood/prebuild/api/src/_build/helloWorld/index.js'
    )

    // Proxy/reExport function placed in the function directory
    expect(cleanPaths(reExportPath)).toBe(
      '.redwood/prebuild/api/src/functions/helloWorld.js'
    )

    expect(reExportContent).toMatchInlineSnapshot(
      `"export * from '../_build/helloWorld';"`
    )
  })

  it('It should not put files that dont match the folder name in dist/functions', () => {
    const [buildPath, { reExportPath }] = getPrebuildOutputOptions(
      path.join(FIXTURE_PATH, 'api/src/functions/helloWorld/anotherFile.ts')
    )

    // File is transpiled to the _build folder
    expect(cleanPaths(buildPath)).toEqual(
      '.redwood/prebuild/api/src/_build/helloWorld/anotherFile.js'
    )

    // But not exposed as a serverless function
    expect(reExportPath).toBe(null)
  })
})

test('api prebuild finds babel.config.js', () => {
  let p = getApiSideBabelConfigPath()
  p = cleanPaths(p)
  expect(p).toEqual('api/babel.config.js')
})

test('api prebuild uses babel config', () => {
  const builtFiles = prebuildApiFiles(findApiFiles())
  const p = builtFiles
    .filter((x) => typeof x !== 'undefined')
    .filter((p) => p.endsWith('dog.js'))
    .pop()

  const code = fs.readFileSync(p, 'utf-8')
  expect(code).toMatchInlineSnapshot(`
    "import dog from \\"dog-bless\\";
    console.log(dog);"
  `)
})
