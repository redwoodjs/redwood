import fs from 'fs'
import path from 'path'

import { getApiSideBabelConfigPath, prebuildApiFiles } from '../build/api'
import { findApiFiles } from '../files'
import { ensurePosixPath } from '../paths'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('api files are prebuilt', () => {
  const builtFiles = prebuildApiFiles(findApiFiles())
  const p = builtFiles.filter((x) => typeof x !== 'undefined').map(cleanPaths)

  expect(p[0].endsWith('api/src/functions/graphql.js')).toBeTruthy()
  expect(p[2].endsWith('api/src/graphql/todos.sdl.js')).toBeTruthy()
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
