global.__dirname = __dirname
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

test('creates a single-word route name', () => {
  const names = ['Home', 'home']

  names.forEach((name) => {
    expect(page.routes({ name: name, path: 'home' })).toEqual([
      '<Route path="home" page={HomePage} name="home" />',
    ])
  })
})

test('creates a camelCase route name for multiple word names', () => {
  const names = ['FooBar', 'foo_bar', 'foo-bar', 'fooBar']

  names.forEach((name) => {
    expect(page.routes({ name: name, path: 'foo-bar' })).toEqual([
      '<Route path="foo-bar" page={FooBarPage} name="fooBar" />',
    ])
  })
})

test('creates a path equal to passed path', () => {
  expect(page.routes({ name: 'FooBar', path: 'fooBar-baz' })).toEqual([
    '<Route path="fooBar-baz" page={FooBarPage} name="fooBar" />',
  ])
})
