global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'

import * as layout from '../layout'

let singleWordDefaultFiles,
  multiWordDefaultFiles,
  javascriptFiles,
  typescriptFiles,
  withoutTestFiles,
  withoutStoryFiles

beforeAll(() => {
  singleWordDefaultFiles = layout.files({ name: 'App' })
  multiWordDefaultFiles = layout.files({ name: 'SinglePage' })
  javascriptFiles = layout.files({
    name: 'JavascriptPage',
    javascript: true,
  })
  typescriptFiles = layout.files({
    name: 'TypescriptPage',
    typescript: true,
  })
  withoutTestFiles = layout.files({
    name: 'withoutTests',
    javascript: true,
    tests: false
  })
  withoutStoryFiles = layout.files({
    name: 'withoutStories',
    javascript: true,
    stories: false
  })
})

test('returns exactly 3 files', () => {
  expect(Object.keys(singleWordDefaultFiles).length).toEqual(3)
})

test('creates a single word layout component', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize('/path/to/project/web/src/layouts/AppLayout/AppLayout.tsx')
    ]
  ).toEqual(loadGeneratorFixture('layout', 'singleWordLayout.tsx'))
})

test('creates a single word layout test', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/AppLayout/AppLayout.test.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'singleWordLayout.test.tsx'))
})

test('creates a single word layout stories', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/AppLayout/AppLayout.stories.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'singleWordLayout.stories.tsx'))
})

test('creates a multi word layout component', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/SinglePageLayout/SinglePageLayout.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'multiWordLayout.tsx'))
})

test('creates a multi word layout test', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/SinglePageLayout/SinglePageLayout.test.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'multiWordLayout.test.tsx'))
})

test('creates a multi word layout test', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/SinglePageLayout/SinglePageLayout.stories.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'multiWordLayout.stories.tsx'))
})

test('creates JS layout components if javacript = true', () => {
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/JavascriptPageLayout/JavascriptPageLayout.js'
      )
    ]
  ).not.toBeUndefined()
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/JavascriptPageLayout/JavascriptPageLayout.test.js'
      )
    ]
  ).not.toBeUndefined()
})

test('creates TS layout components if typescript = true', () => {
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/TypescriptPageLayout/TypescriptPageLayout.tsx'
      )
    ]
  ).not.toBeUndefined()
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/TypescriptPageLayout/TypescriptPageLayout.test.tsx'
      )
    ]
  ).not.toBeUndefined()
})

test("doesn't include storybook file when --stories is set to false", () => {
  expect(Object.keys(withoutStoryFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/layouts/WithoutStoriesLayout/WithoutStoriesLayout.test.js'
    ),
    path.normalize(
      '/path/to/project/web/src/layouts/WithoutStoriesLayout/WithoutStoriesLayout.js'
    ),
  ])
})

test("doesn't include test file when --tests is set to false", () => {
  expect(Object.keys(withoutTestFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/layouts/WithoutTestsLayout/WithoutTestsLayout.stories.js'
    ),
    path.normalize(
      '/path/to/project/web/src/layouts/WithoutTestsLayout/WithoutTestsLayout.js'
    ),
  ])
})
