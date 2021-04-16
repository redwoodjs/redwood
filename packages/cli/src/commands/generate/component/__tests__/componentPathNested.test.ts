global.__dirname = __dirname
import path from 'path'

// TODO: Revert to import from '../component' when it gets types.
import { loadGeneratorFixture } from 'src/lib/test'

import * as component from '../component'

let singleWordDefaultFiles,
  multiWordDefaultFiles,
  javascriptFiles,
  typescriptFiles,
  withoutTestFiles,
  withoutStoryFiles

beforeAll(() => {
  singleWordDefaultFiles = component.files({ name: 'nested/admin/user' })
  multiWordDefaultFiles = component.files({ name: 'nested/admin/userProfile' })
  javascriptFiles = component.files({
    name: 'nested/admin/JavascriptUser',
    javascript: true,
  })
  typescriptFiles = component.files({
    name: 'nested/admin/TypescriptUser',
    typescript: true,
  })
  withoutTestFiles = component.files({
    name: 'nested/admin/withoutTests',
    javascript: true,
    tests: false,
  })
  withoutStoryFiles = component.files({
    name: 'nested/admin/withoutStories',
    javascript: true,
    stories: false,
  })
})

test('returns exactly 3 files', () => {
  expect(Object.keys(singleWordDefaultFiles).length).toEqual(3)
})

test('creates a single word component', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/User/User.tsx'
      )
    ]
  ).toEqual(
    loadGeneratorFixture('component', 'singleWordComponentNestedPath.tsx')
  )
})

test('creates a single word component test', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/User/User.test.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('component', 'singleWordComponent.test.tsx'))
})

test('creates a single word component story', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/User/User.stories.tsx'
      )
    ]
  ).toEqual(
    loadGeneratorFixture('component', 'singleWordComponent.stories.tsx')
  )
})

test('creates a multi word component', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserProfile/UserProfile.tsx'
      )
    ]
  ).toEqual(
    loadGeneratorFixture('component', 'multiWordComponentNestedPath.tsx')
  )
})

test('creates a multi word component test', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserProfile/UserProfile.test.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('component', 'multiWordComponent.test.tsx'))
})

test('creates a multi word component story', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserProfile/UserProfile.stories.tsx'
      )
    ]
  ).toEqual(loadGeneratorFixture('component', 'multiWordComponent.stories.tsx'))
})

test('creates JS component files if javacript = true', () => {
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/JavascriptUser/JavascriptUser.js'
      )
    ]
  ).not.toBeUndefined()
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/JavascriptUser/JavascriptUser.test.js'
      )
    ]
  ).not.toBeUndefined()
})

test('creates TS component files if typescript = true', () => {
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/TypescriptUser/TypescriptUser.tsx'
      )
    ]
  ).not.toBeUndefined()
  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/TypescriptUser/TypescriptUser.test.tsx'
      )
    ]
  ).not.toBeUndefined()
})

test("doesn't include storybook file when --stories is set to false", () => {
  expect(Object.keys(withoutStoryFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/WithoutStories/WithoutStories.test.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/WithoutStories/WithoutStories.js'
    ),
  ])
})

test("doesn't include test file when --tests is set to false", () => {
  expect(Object.keys(withoutTestFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/WithoutTests/WithoutTests.stories.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/WithoutTests/WithoutTests.js'
    ),
  ])
})
