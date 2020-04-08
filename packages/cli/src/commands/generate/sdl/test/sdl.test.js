global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as sdl from '../sdl'

let files //, crudFiles

beforeAll(async () => {
  files = await sdl.files({ name: 'User', crud: false })
  // crudFiles = await sdl.files({ name: 'Post', crud: true })
})

afterEach(() => {
  jest.clearAllMocks()
})

test('creates a sdl file', () => {
  expect(files['/path/to/project/api/src/graphql/users.sdl.js']).toEqual(
    loadGeneratorFixture('sdl', 'sdl.js')
  )
})

// test('creates a sdl file with CRUD actions', () => {
//   expect(crudFiles['/path/to/project/api/src/sdls/posts/posts.js']).toEqual(
//     loadGeneratorFixture('sdl', 'sdlCrud.js')
//   )
// })
