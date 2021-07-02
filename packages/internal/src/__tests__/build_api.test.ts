import path from 'path'

import { prebuildApiFiles, buildApi } from '../build/api'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('api files are prebuilt', () => {
  // const builtFiles = prebuildApiFiles()
  // expect(builtFiles[0].endsWith('api/src/functions/graphql.js')).toBeTruthy()
  // expect(builtFiles[2].endsWith('api/src/graphql/todos.sdl.js')).toBeTruthy()
})

test.only('api side is built', () => {
  const x = buildApi()

  x //?

  // let files = prebuildApi()
  // files = files.filter((x) => typeof x !== 'undefined') //?
  // const f = transpileApi(files)
  // f //?
  // const builtFiles = prebuildApi()
  // expect(builtFiles[0].endsWith('api/src/functions/graphql.js')).toBeTruthy()
  // expect(builtFiles[2].endsWith('api/src/graphql/todos.sdl.js')).toBeTruthy()
})
