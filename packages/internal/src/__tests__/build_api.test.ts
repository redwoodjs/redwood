import path from 'path'

import { prebuildApiFiles } from '../build/api'
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
