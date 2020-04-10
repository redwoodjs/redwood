global.__dirname = __dirname
import path from 'path'

import {
  loadFixture,
  loadGeneratorFixture,
  serviceFixturesPath,
} from 'src/lib/test'

import * as sdl from '../sdl'

afterEach(() => {
  jest.clearAllMocks()
})

test('returns exactly 3 files', async () => {
  const files = await sdl.files({ name: 'Post', crud: false })

  expect(Object.keys(files).length).toEqual(3)
})

test('creates a service', async () => {
  const files = await sdl.files({ name: 'User', crud: false })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadFixture(path.join(serviceFixturesPath, 'singleWordService.js'))
  )
})

test('creates a service test', async () => {
  const files = await sdl.files({ name: 'User', crud: false })

  expect(
    files['/path/to/project/api/src/services/users/users.test.js']
  ).toEqual(
    loadFixture(path.join(serviceFixturesPath, 'singleWordService.test.js'))
  )
})

test('the generated service inherits crud setting', async () => {
  const files = await sdl.files({ name: 'Post', crud: true })

  expect(
    files['/path/to/project/api/src/services/posts/posts.test.js']
  ).toEqual(
    loadFixture(path.join(serviceFixturesPath, 'singleWordServiceCrud.test.js'))
  )
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
