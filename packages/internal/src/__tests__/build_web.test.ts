import path from 'path'

import { prebuildWebFiles, cleanWebBuild } from '../build/web'
import { findWebFiles } from '../files'
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
  cleanWebBuild()

  const webFiles = findWebFiles()
  prebuiltFiles = prebuildWebFiles(webFiles)

  relativePaths = prebuiltFiles
    .filter((x) => typeof x !== 'undefined')
    .map(cleanPaths)
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('api files are prebuilt', () => {
  // Builds non-nested functions
  relativePaths //?
})
