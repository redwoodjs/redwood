global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as sdl from '../sdl'

afterEach(() => {
  jest.clearAllMocks()
})

test('returns exactly 1 file', async () => {
  const files = await sdl.files({ name: 'User', crud: false })

  expect(Object.keys(files).length).toEqual(1)
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
