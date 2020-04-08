global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as service from '../service'

test('creates a single word service file', async () => {
  const files = await service.files({ name: 'User', crud: false })

  expect(files['/path/to/project/api/src/services/users/users.js']).toEqual(
    loadGeneratorFixture('service', 'singleWordService.js')
  )
})

test('creates a single word service test file', async () => {
  const files = await service.files({ name: 'User', crud: false })

  expect(
    files['/path/to/project/api/src/services/users/users.test.js']
  ).toEqual(loadGeneratorFixture('service', 'singleWordService.test.js'))
})

test('creates a multi word service file', async () => {
  const files = await service.files({ name: 'UserProfile', crud: false })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.js']
  ).toEqual(loadGeneratorFixture('service', 'multiWordService.js'))
})

test('creates a multi word service test file', async () => {
  const files = await service.files({ name: 'UserProfile', crud: false })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.test.js']
  ).toEqual(loadGeneratorFixture('service', 'multiWordService.test.js'))
})

test('creates a single word service file with CRUD actions', async () => {
  const files = await service.files({ name: 'Post', crud: true })

  expect(files['/path/to/project/api/src/services/posts/posts.js']).toEqual(
    loadGeneratorFixture('service', 'singleWordServiceCrud.js')
  )
})

test('creates a service test file with CRUD actions', async () => {
  const files = await service.files({ name: 'Post', crud: true })

  expect(
    files['/path/to/project/api/src/services/posts/posts.test.js']
  ).toEqual(loadGeneratorFixture('service', 'singleWordServiceCrud.test.js'))
})

test('creates a multi word service file with CRUD actions', async () => {
  const files = await service.files({ name: 'UserProfile', crud: true })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.js']
  ).toEqual(loadGeneratorFixture('service', 'multiWordServiceCrud.js'))
})

test('creates a multi word service test file with CRUD actions', async () => {
  const files = await service.files({ name: 'UserProfile', crud: true })

  expect(
    files['/path/to/project/api/src/services/userProfiles/userProfiles.test.js']
  ).toEqual(loadGeneratorFixture('service', 'multiWordServiceCrud.test.js'))
})
