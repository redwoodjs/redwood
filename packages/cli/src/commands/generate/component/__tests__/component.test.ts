global.__dirname = __dirname
import path from 'path'

import yargs from 'yargs'

// Shared mocks for paths, etc.
import '../../../../lib/test'

import * as component from '../component'

let singleWordDefaultFiles,
  multiWordDefaultFiles,
  javascriptFiles,
  typescriptFiles,
  withoutTestFiles,
  withoutStoryFiles

beforeAll(() => {
  singleWordDefaultFiles = component.files({
    name: 'User',
    tests: true,
    stories: true,
  })
  multiWordDefaultFiles = component.files({
    name: 'UserProfile',
    tests: true,
    stories: true,
  })
  javascriptFiles = component.files({
    name: 'JavascriptUser',
    typescript: false,
    stories: true,
    tests: true,
  })
  typescriptFiles = component.files({
    name: 'TypescriptUser',
    typescript: true,
    stories: true,
    tests: true,
  })
  withoutTestFiles = component.files({
    name: 'withoutTests',
    javascript: true,
    stories: true,
    tests: false,
  })
  withoutStoryFiles = component.files({
    name: 'withoutStories',
    javascript: true,
    tests: true,
    stories: false,
  })
})

test('returns exactly 3 files', () => {
  expect(Object.keys(singleWordDefaultFiles).length).toEqual(3)
})

test('keeps Component in name', () => {
  const { name } = yargs
    .command('component <name>', false, component.builder)
    .parse('component BazingaComponent')

  expect(name).toEqual('BazingaComponent')
})

test('creates a single word component', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize('/path/to/project/web/src/components/User/User.js')
    ]
  ).toMatchSnapshot()
})

test('creates a single word component test', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize('/path/to/project/web/src/components/User/User.test.js')
    ]
  ).toMatchSnapshot()
})

test('creates a single word component story', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize('/path/to/project/web/src/components/User/User.stories.js')
    ]
  ).toMatchSnapshot()
})

test('creates a multi word component', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfile/UserProfile.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a TS component and test', () => {
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/TypescriptUser/TypescriptUser.tsx'
      )
    ]
  ).toMatchSnapshot()
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/TypescriptUser/TypescriptUser.test.tsx'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a multi word component test', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfile/UserProfile.test.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a multi word component story', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfile/UserProfile.stories.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates JS component files if typescript = false', () => {
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/JavascriptUser/JavascriptUser.js'
      )
    ]
  ).not.toBeUndefined()
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/JavascriptUser/JavascriptUser.test.js'
      )
    ]
  ).not.toBeUndefined()
})

test('creates TS component files if typescript = true', () => {
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/TypescriptUser/TypescriptUser.tsx'
      )
    ]
  ).not.toBeUndefined()
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/TypescriptUser/TypescriptUser.test.tsx'
      )
    ]
  ).not.toBeUndefined()
})

test("doesn't include storybook file when --stories is set to false", () => {
  expect(Object.keys(withoutStoryFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/WithoutStories/WithoutStories.test.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/WithoutStories/WithoutStories.js'
    ),
  ])
})

test("doesn't include test file when --tests is set to false", () => {
  expect(Object.keys(withoutTestFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/WithoutTests/WithoutTests.stories.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/WithoutTests/WithoutTests.js'
    ),
  ])
})
