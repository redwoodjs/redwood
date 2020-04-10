global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as service from '../service'

test('returns exactly 2 files', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: [],
  })

  expect(Object.keys(files).length).toEqual(2)
})

test('creates a single word service file', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: [],
  })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture('service', 'singleWord.js')
  )
})

test('creates a single word service test file', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/users/users.test.js']
  ).toEqual(loadGeneratorFixture('service', 'singleWord.test.js'))
})

test('creates a multi word service file', async () => {
  const files = await service.files({
    name: 'UserProfile',
    crud: false,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.js']
  ).toEqual(loadGeneratorFixture('service', 'multiWord.js'))
})

test('creates a multi word service test file', async () => {
  const files = await service.files({
    name: 'UserProfile',
    crud: false,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.test.js']
  ).toEqual(loadGeneratorFixture('service', 'multiWord.test.js'))
})

test('creates a single word service file with CRUD actions', async () => {
  const files = await service.files({
    name: 'Post',
    crud: true,
    relations: null,
  })

  expect(files['/path/to/project/api/src/services/posts/posts.js']).toEqual(
    loadGeneratorFixture('service', 'singleWord_crud.js')
  )
})

test('creates a service test file with CRUD actions', async () => {
  const files = await service.files({
    name: 'Post',
    crud: true,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/posts/posts.test.js']
  ).toEqual(loadGeneratorFixture('service', 'singleWord_crud.test.js'))
})

test('creates a multi word service file with CRUD actions', async () => {
  const files = await service.files({
    name: 'UserProfile',
    crud: true,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.js']
  ).toEqual(loadGeneratorFixture('service', 'multiWord_crud.js'))
})

test('creates a multi word service test file with CRUD actions', async () => {
  const files = await service.files({
    name: 'UserProfile',
    crud: true,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.test.js']
  ).toEqual(loadGeneratorFixture('service', 'multiWord_crud.test.js'))
})

test('creates a single word service file with a hasMany relation', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: ['userProfiles'],
  })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture('service', 'singleWord_hasMany.js')
  )
})

test('creates a single word service file with a belongsTo relation', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: ['identity'],
  })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture('service', 'singleWord_belongsTo.js')
  )
})

test('creates a single word service file with multiple relations', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: ['userProfiles', 'identity'],
  })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture('service', 'singleWord_multiple.js')
  )
})
