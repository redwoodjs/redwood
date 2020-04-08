global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as service from '../service'

let files, crudFiles

beforeAll(async () => {
  files = await service.files({ name: 'User', crud: false })
  crudFiles = await service.files({ name: 'Post', crud: true })
})

test('creates a service file', () => {
  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture('service', 'service.js')
  )
})

test('creates a service test file', () => {
  expect(
    files['/path/to/project/api/src/services/users/users.test.js']
  ).toEqual(loadGeneratorFixture('service', 'service.test.js'))
})

test('creates a service file with CRUD actions', () => {
  expect(crudFiles['/path/to/project/api/src/services/posts/posts.js']).toEqual(
    loadGeneratorFixture('service', 'serviceCrud.js')
  )
})

test('creates a service test file with CRUD actions', () => {
  expect(
    crudFiles['/path/to/project/api/src/services/posts/posts.test.js']
  ).toEqual(loadGeneratorFixture('service', 'serviceCrud.test.js'))
})
