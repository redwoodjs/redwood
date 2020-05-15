global.__dirname = __dirname

import { loadGeneratorFixture } from 'src/lib/test'

import * as sdl from '../sdl'

afterEach(() => {
  jest.clearAllMocks()
})

test('returns exactly 3 files', async () => {
  const files = await sdl.files({ name: 'Post', crud: false })

  expect(Object.keys(files).length).toEqual(3)
})

// in this case we'll trust that a service and test are actually created
// with the correct filename, but the contents of that file should be the
// job of the service tests
test('creates a service', async () => {
  const files = await sdl.files({ name: 'User', crud: false })

  expect(files).toHaveProperty([
    '/path/to/project/api/src/services/users/users.js',
  ])
  expect(files).toHaveProperty([
    '/path/to/project/api/src/services/users/users.test.js',
  ])
})

test('creates a single word sdl file', async () => {
  const files = await sdl.files({ name: 'User', crud: false })

  expect(files['/path/to/project/api/src/graphql/users.sdl.js']).toEqual(
    loadGeneratorFixture('sdl', 'singleWordSdl.js')
  )
})

test('creates a multi word sdl file', async () => {
  const files = await sdl.files({ name: 'UserProfile', crud: false })

  expect(files['/path/to/project/api/src/graphql/userProfiles.sdl.js']).toEqual(
    loadGeneratorFixture('sdl', 'multiWordSdl.js')
  )
})

test('creates a single word sdl file with CRUD actions', async () => {
  const files = await sdl.files({ name: 'Post', crud: true })

  expect(files['/path/to/project/api/src/graphql/posts.sdl.js']).toEqual(
    loadGeneratorFixture('sdl', 'singleWordSdlCrud.js')
  )
})

test('creates a multi word sdl file with CRUD actions', async () => {
  const files = await sdl.files({ name: 'UserProfile', crud: true })

  expect(files['/path/to/project/api/src/graphql/userProfiles.sdl.js']).toEqual(
    loadGeneratorFixture('sdl', 'multiWordSdlCrud.js')
  )
})

test('creates a sdl file with enum definitions', async () => {
  const files = await sdl.files({ name: 'Shoe', crud: true })

  expect(files['/path/to/project/api/src/graphql/shoes.sdl.js']).toEqual(
    loadGeneratorFixture('sdl', 'enumGeneratedSdl.js')
  )
})
