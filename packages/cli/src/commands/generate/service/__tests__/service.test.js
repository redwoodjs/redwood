global.__dirname = __dirname
import path from 'path'

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
    loadGeneratorFixture('service', path.join('singleWord', 'service.js'))
  )
})

test('creates a single word service file with a hasMany relation', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: ['userProfiles'],
  })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture(
      'service',
      path.join('singleWord', 'relations', 'hasMany.js')
    )
  )
})

test('creates a single word service file with a belongsTo relation', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: ['identity'],
  })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture(
      'service',
      path.join('singleWord', 'relations', 'belongsTo.js')
    )
  )
})

test('creates a single word service file with multiple relations', async () => {
  const files = await service.files({
    name: 'User',
    crud: false,
    relations: ['userProfiles', 'identity'],
  })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture(
      'service',
      path.join('singleWord', 'relations', 'multiple.js')
    )
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
  ).toEqual(
    loadGeneratorFixture('service', path.join('singleWord', 'service.test.js'))
  )
})

test('creates a multi word service file', async () => {
  const files = await service.files({
    name: 'UserProfile',
    crud: false,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.js']
  ).toEqual(
    loadGeneratorFixture('service', path.join('multiWord', 'service.js'))
  )
})

test('creates a multi word service test file', async () => {
  const files = await service.files({
    name: 'UserProfile',
    crud: false,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.test.js']
  ).toEqual(
    loadGeneratorFixture('service', path.join('multiWord', 'service.test.js'))
  )
})

test('creates a single word service file with CRUD actions', async () => {
  const files = await service.files({
    name: 'Post',
    crud: true,
    relations: null,
  })

  expect(files['/path/to/project/api/src/services/posts/posts.js']).toEqual(
    loadGeneratorFixture(
      'service',
      path.join('singleWord', 'crud', 'service.js')
    )
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
  ).toEqual(
    loadGeneratorFixture(
      'service',
      path.join('singleWord', 'crud', 'service.test.js')
    )
  )
})

test('creates a multi word service file with CRUD actions', async () => {
  const files = await service.files({
    name: 'UserProfile',
    crud: true,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.js']
  ).toEqual(
    loadGeneratorFixture(
      'service',
      path.join('multiWord', 'crud', 'service.js')
    )
  )
})

test('creates a multi word service test file with CRUD actions', async () => {
  const files = await service.files({
    name: 'UserProfile',
    crud: true,
    relations: null,
  })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.test.js']
  ).toEqual(
    loadGeneratorFixture(
      'service',
      path.join('multiWord', 'crud', 'service.test.js')
    )
  )
})
