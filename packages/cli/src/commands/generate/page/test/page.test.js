import { loadGeneratorFixture } from 'src/lib/test'

import * as page from '../page'

let files

beforeAll(() => {
  files = page.files({ name: 'Home' })
})

test('creates a page component', () => {
  expect(files['/path/to/project/web/src/pages/HomePage/HomePage.js']).toEqual(
    loadGeneratorFixture('page', 'page.js')
  )
})

test('creates a page test', () => {
  expect(
    files['/path/to/project/web/src/pages/HomePage/HomePage.test.js']
  ).toEqual(loadGeneratorFixture('page', 'page.test.js'))
})
