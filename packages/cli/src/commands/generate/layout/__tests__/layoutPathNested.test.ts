global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'

import * as layout from '../layout'

let singleWordDefaultFiles,
  multiWordDefaultFiles,
  javascriptFiles,
  typescriptFiles,
  withoutTestFiles,
  withoutStoryFiles,
  withSkipLinkFiles

beforeAll(() => {
  singleWordDefaultFiles = layout.files({ name: 'nested/admin/app' })
  multiWordDefaultFiles = layout.files({ name: 'nested/admin/singlePage' })
  javascriptFiles = layout.files({
    name: 'nested/admin/JavascriptPage',
    javascript: true,
  })
  typescriptFiles = layout.files({
    name: 'nested/admin/TypescriptPage',
    typescript: true,
  })
  withoutTestFiles = layout.files({
    name: 'nested/admin/withoutTests',
    javascript: true,
    tests: false,
  })
  withoutStoryFiles = layout.files({
    name: 'nested/admin/withoutStories',
    javascript: true,
    stories: false,
  })
  withSkipLinkFiles = layout.files({
    name: 'nested/admin/A11y',
    skipLink: true,
  })
})

test('returns exactly 3 files', () => {
  expect(Object.keys(singleWordDefaultFiles).length).toEqual(3)
})

test('creates a single word layout component', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/AppLayout/AppLayout.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'singleWordLayout.tsx'))
})

test('creates a single word layout test', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/AppLayout/AppLayout.test.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'singleWordLayout.test.tsx'))
})

test('creates a single word layout stories', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/AppLayout/AppLayout.stories.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'singleWordLayout.stories.tsx'))
})

test('creates a multi word layout component', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/SinglePageLayout/SinglePageLayout.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'multiWordLayout.tsx'))
})

test('creates a multi word layout test', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/SinglePageLayout/SinglePageLayout.test.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'multiWordLayout.test.tsx'))
})

test('creates a multi word layout test', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/SinglePageLayout/SinglePageLayout.stories.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'multiWordLayout.stories.tsx'))
})

test('creates JS layout components if javacript = true', () => {
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/JavascriptPageLayout/JavascriptPageLayout.js'
      )
    ]
  ).not.toBeUndefined()
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/JavascriptPageLayout/JavascriptPageLayout.test.js'
      )
    ]
  ).not.toBeUndefined()
})

test('creates TS layout components if typescript = true', () => {
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/TypescriptPageLayout/TypescriptPageLayout.tsx'
      )
    ]
  ).not.toBeUndefined()
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/TypescriptPageLayout/TypescriptPageLayout.test.tsx'
      )
    ]
  ).not.toBeUndefined()
})

test("doesn't include storybook file when --stories is set to false", () => {
  expect(Object.keys(withoutStoryFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/layouts/nested/admin/WithoutStoriesLayout/WithoutStoriesLayout.test.js'
    ),
    path.normalize(
      '/path/to/project/web/src/layouts/nested/admin/WithoutStoriesLayout/WithoutStoriesLayout.js'
    ),
  ])
})

test("doesn't include test file when --tests is set to false", () => {
  expect(Object.keys(withoutTestFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/layouts/nested/admin/WithoutTestsLayout/WithoutTestsLayout.stories.js'
    ),
    path.normalize(
      '/path/to/project/web/src/layouts/nested/admin/WithoutTestsLayout/WithoutTestsLayout.js'
    ),
  ])
})

test.only('includes skip link when --skipLink is set to true', () => {
  expect(
    withSkipLinkFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/nested/admin/A11yLayout/A11yLayout.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'withSkipLinkLayout.tsx'))
})
