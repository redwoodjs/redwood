global.__dirname = __dirname
import path from 'path'

jest.mock('@redwoodjs/structure', () => {
  return {
    getProject: () => ({
      cells: [{ queryOperationName: undefined }],
    }),
  }
})

import { loadGeneratorFixture } from 'src/lib/test'

import * as cell from '../cell'

let singleWordFiles,
  multiWordFiles,
  withoutTestFiles,
  withoutStoryFiles,
  withoutTestAndStoryFiles

beforeAll(async () => {
  singleWordFiles = await cell.files({ name: 'Nested/Admin/User' })
  multiWordFiles = await cell.files({ name: 'Nested/Admin/UserProfile' })
  withoutTestFiles = await cell.files({
    name: 'Nested/Admin/User',
    tests: false,
  })
  withoutStoryFiles = await cell.files({
    name: 'Nested/Admin/User',
    stories: false,
  })
  withoutTestAndStoryFiles = await cell.files({
    name: 'Nested/Admin/User',
    tests: false,
    stories: false,
  })
})

// Single Word Scenario: User
test('returns exactly 4 files', () => {
  expect(Object.keys(singleWordFiles).length).toEqual(4)
})

test('creates a cell component with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'singleWordCell.js'))
})

test('creates a cell test with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.test.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'singleWordCell.test.js'))
})

test('creates a cell stories with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.stories.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'singleWordCell.stories.js'))
})

test('creates a cell mock with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.mock.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'singleWordCell.mock.js'))
})

// Multi Word Scenario: UserProfile
test('creates a cell component with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserProfileCell/UserProfileCell.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'multiWordCell.js'))
})

test('creates a cell test with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserProfileCell/UserProfileCell.test.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'multiWordCell.test.js'))
})

test('creates a cell stories with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserProfileCell/UserProfileCell.stories.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'multiWordCell.stories.js'))
})

test('creates a cell mock with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/nested/admin/UserProfileCell/UserProfileCell.mock.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'multiWordCell.mock.js'))
})

test("doesn't include test file when --tests is set to false", () => {
  expect(Object.keys(withoutTestFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.mock.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.stories.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.js'
    ),
  ])
})

test("doesn't include storybook file when --stories is set to false", () => {
  expect(Object.keys(withoutStoryFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.mock.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.test.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.js'
    ),
  ])
})

test("doesn't include storybook and test files when --stories and --tests is set to false", () => {
  expect(Object.keys(withoutTestAndStoryFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/nested/admin/UserCell/UserCell.js'
    ),
  ])
})
