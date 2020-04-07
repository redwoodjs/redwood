import { loadGeneratorFixture } from 'src/lib/test'

import * as layout from '../layout'

let files

beforeAll(() => {
  files = layout.files({ name: 'App' })
})

test('creates a layout component', () => {
  expect(
    files['/path/to/project/web/src/layouts/AppLayout/AppLayout.js']
  ).toEqual(loadGeneratorFixture('layout', 'layout.js'))
})

test('creates a layout test', () => {
  expect(
    files['/path/to/project/web/src/layouts/AppLayout/AppLayout.test.js']
  ).toEqual(loadGeneratorFixture('layout', 'layout.test.js'))
})
