global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as component from '../component'

let files

beforeAll(() => {
  files = component.files({ name: 'User' })
})

test('creates a component', () => {
  expect(files['/path/to/project/web/src/components/User/User.js']).toEqual(
    loadGeneratorFixture('component', 'component.js')
  )
})

test('creates a component test', () => {
  expect(
    files['/path/to/project/web/src/components/User/User.test.js']
  ).toEqual(loadGeneratorFixture('component', 'component.test.js'))
})
