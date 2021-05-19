global.__dirname = __dirname
import path from 'path'

// Load mocks
import 'src/lib/test'
import * as cell from '../cell'

jest.mock('@redwoodjs/structure', () => {
  return {
    getProject: () => ({
      cells: [{ queryOperationName: undefined }],
    }),
  }
})

let singleWordFiles,
  multiWordFiles,
  snakeCaseWordFiles,
  kebabCaseWordFiles,
  camelCaseWordFiles,
  withoutTestFiles,
  withoutStoryFiles,
  withoutTestAndStoryFiles

beforeAll(async () => {
  singleWordFiles = await cell.files({
    name: 'User',
    tests: true,
    stories: true,
  })
  multiWordFiles = await cell.files({
    name: 'UserProfile',
    tests: true,
    stories: true,
  })
  snakeCaseWordFiles = await cell.files({
    name: 'user_profile',
    tests: true,
    stories: true,
  })
  kebabCaseWordFiles = await cell.files({
    name: 'user-profile',
    tests: true,
    stories: true,
  })
  camelCaseWordFiles = await cell.files({
    name: 'userProfile',
    tests: true,
    stories: true,
  })
  withoutTestFiles = await cell.files({
    name: 'User',
    tests: false,
    stories: true,
  })
  withoutStoryFiles = await cell.files({
    name: 'User',
    tests: true,
    stories: false,
  })
  withoutTestAndStoryFiles = await cell.files({
    name: 'User',
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
      path.normalize('/path/to/project/web/src/components/UserCell/UserCell.js')
    ]
  ).toMatchSnapshot()
})

test('creates a cell test with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserCell/UserCell.test.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell stories with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserCell/UserCell.stories.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell mock with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserCell/UserCell.mock.js'
      )
    ]
  ).toMatchSnapshot()
})

// Multi Word Scenario: UserProfile
test('creates a cell component with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell test with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.test.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell stories with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.stories.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell mock with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.mock.js'
      )
    ]
  ).toMatchSnapshot()
})

// SnakeCase Word Scenario: user_profile
test('creates a cell component with a snakeCase word name', () => {
  expect(
    snakeCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell test with a snakeCase word name', () => {
  expect(
    snakeCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.test.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell stories with a snakeCase word name', () => {
  expect(
    snakeCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.stories.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell mock with a snakeCase word name', () => {
  expect(
    snakeCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.mock.js'
      )
    ]
  ).toMatchSnapshot()
})

// KebabCase Word Scenario: user-profile
test('creates a cell component with a kebabCase word name', () => {
  expect(
    kebabCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell test with a kebabCase word name', () => {
  expect(
    kebabCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.test.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell stories with a kebabCase word name', () => {
  expect(
    kebabCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.stories.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell mock with a kebabCase word name', () => {
  expect(
    kebabCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.mock.js'
      )
    ]
  ).toMatchSnapshot()
})

// camelCase Word Scenario: user-profile
test('creates a cell component with a camelCase word name', () => {
  expect(
    camelCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell test with a camelCase word name', () => {
  expect(
    camelCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.test.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell stories with a camelCase word name', () => {
  expect(
    camelCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.stories.js'
      )
    ]
  ).toMatchSnapshot()
})

test('creates a cell mock with a camelCase word name', () => {
  expect(
    camelCaseWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.mock.js'
      )
    ]
  ).toMatchSnapshot()
})

test("doesn't include test file when --tests is set to false", () => {
  expect(Object.keys(withoutTestFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/UserCell/UserCell.mock.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/UserCell/UserCell.stories.js'
    ),
    path.normalize('/path/to/project/web/src/components/UserCell/UserCell.js'),
  ])
})

test("doesn't include storybook file when --stories is set to false", () => {
  expect(Object.keys(withoutStoryFiles)).toEqual([
    path.normalize(
      '/path/to/project/web/src/components/UserCell/UserCell.mock.js'
    ),
    path.normalize(
      '/path/to/project/web/src/components/UserCell/UserCell.test.js'
    ),
    path.normalize('/path/to/project/web/src/components/UserCell/UserCell.js'),
  ])
})

test("doesn't include storybook and test files when --stories and --tests is set to false", () => {
  expect(Object.keys(withoutTestAndStoryFiles)).toEqual([
    path.normalize('/path/to/project/web/src/components/UserCell/UserCell.js'),
  ])
})
