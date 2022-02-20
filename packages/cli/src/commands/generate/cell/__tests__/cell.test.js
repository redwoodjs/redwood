global.__dirname = __dirname
import path from 'path'

// Load mocks
import '../../../../lib/test'
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
  withoutTestAndStoryFiles,
  listFlagPassedIn,
  listInferredFromName,
  modelPluralMatchesSingularWithList,
  modelPluralMatchesSingularWithoutList

beforeAll(async () => {
  singleWordFiles = await cell.files({
    name: 'User',
    tests: true,
    stories: true,
    list: false,
  })
  multiWordFiles = await cell.files({
    name: 'UserProfile',
    tests: true,
    stories: true,
    list: false,
  })
  snakeCaseWordFiles = await cell.files({
    name: 'user_profile',
    tests: true,
    stories: true,
    list: false,
  })
  kebabCaseWordFiles = await cell.files({
    name: 'user-profile',
    tests: true,
    stories: true,
    list: false,
  })
  camelCaseWordFiles = await cell.files({
    name: 'userProfile',
    tests: true,
    stories: true,
    list: false,
  })
  withoutTestFiles = await cell.files({
    name: 'User',
    tests: false,
    stories: true,
    list: false,
  })
  withoutStoryFiles = await cell.files({
    name: 'User',
    tests: true,
    stories: false,
    list: false,
  })
  withoutTestAndStoryFiles = await cell.files({
    name: 'User',
    tests: false,
    stories: false,
    list: false,
  })

  listFlagPassedIn = await cell.files({
    name: 'Member',
    tests: true,
    stories: true,
    list: true,
  })

  listInferredFromName = await cell.files({
    name: 'Members',
    tests: true,
    stories: true,
  })

  modelPluralMatchesSingularWithList = await cell.files({
    name: 'equipment',
    tests: true,
    stories: true,
    list: true,
  })

  modelPluralMatchesSingularWithoutList = await cell.files({
    name: 'equipment',
    tests: true,
    stories: true,
    list: false,
  })
})

// Single Word Scenario: User
test('returns exactly 4 files', () => {
  expect(Object.keys(singleWordFiles).length).toEqual(4)
})

test('trims Cell from end of name', async () => {
  const files = await cell.files({
    name: 'BazingaCell',
    tests: true,
    stories: true,
  })

  const cellCode =
    files[
      path.normalize(
        '/path/to/project/web/src/components/BazingaCell/BazingaCell.js'
      )
    ]

  expect(cellCode).not.toBeUndefined()
  expect(
    cellCode.split('\n').includes('export const Success = ({ bazinga }) => {')
  ).toBeTruthy()
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

test('generates list cells if list flag passed in', () => {
  const CELL_PATH = path.normalize(
    '/path/to/project/web/src/components/MembersCell/MembersCell.js'
  )

  const TEST_PATH = path.normalize(
    '/path/to/project/web/src/components/MembersCell/MembersCell.test.js'
  )

  const STORY_PATH = path.normalize(
    '/path/to/project/web/src/components/MembersCell/MembersCell.stories.js'
  )

  const MOCK_PATH = path.normalize(
    '/path/to/project/web/src/components/MembersCell/MembersCell.mock.js'
  )

  // Check the file names
  expect(Object.keys(listFlagPassedIn)).toEqual([
    MOCK_PATH,
    TEST_PATH,
    STORY_PATH,
    CELL_PATH,
  ])

  // Check the contents
  expect(listFlagPassedIn[CELL_PATH]).toMatchSnapshot()
})

test('generates list cells if name is plural', () => {
  const CELL_PATH = path.normalize(
    '/path/to/project/web/src/components/MembersCell/MembersCell.js'
  )

  const TEST_PATH = path.normalize(
    '/path/to/project/web/src/components/MembersCell/MembersCell.test.js'
  )

  const STORY_PATH = path.normalize(
    '/path/to/project/web/src/components/MembersCell/MembersCell.stories.js'
  )

  const MOCK_PATH = path.normalize(
    '/path/to/project/web/src/components/MembersCell/MembersCell.mock.js'
  )

  // Check the file names
  expect(Object.keys(listInferredFromName)).toEqual([
    MOCK_PATH,
    TEST_PATH,
    STORY_PATH,
    CELL_PATH,
  ])

  // Check the contents
  expect(listInferredFromName[CELL_PATH]).toMatchSnapshot()
})

test('"equipment" with list flag', () => {
  const CELL_PATH = path.normalize(
    '/path/to/project/web/src/components/EquipmentListCell/EquipmentListCell.js'
  )

  const TEST_PATH = path.normalize(
    '/path/to/project/web/src/components/EquipmentListCell/EquipmentListCell.test.js'
  )

  const STORY_PATH = path.normalize(
    '/path/to/project/web/src/components/EquipmentListCell/EquipmentListCell.stories.js'
  )

  const MOCK_PATH = path.normalize(
    '/path/to/project/web/src/components/EquipmentListCell/EquipmentListCell.mock.js'
  )

  // Check the file names
  expect(Object.keys(modelPluralMatchesSingularWithList)).toEqual([
    MOCK_PATH,
    TEST_PATH,
    STORY_PATH,
    CELL_PATH,
  ])

  // Check the contents
  expect(modelPluralMatchesSingularWithList[CELL_PATH]).toMatchSnapshot()
})

test('"equipment" withOUT list flag should find equipment by id', () => {
  const CELL_PATH = path.normalize(
    '/path/to/project/web/src/components/EquipmentCell/EquipmentCell.js'
  )

  const TEST_PATH = path.normalize(
    '/path/to/project/web/src/components/EquipmentCell/EquipmentCell.test.js'
  )

  const STORY_PATH = path.normalize(
    '/path/to/project/web/src/components/EquipmentCell/EquipmentCell.stories.js'
  )

  const MOCK_PATH = path.normalize(
    '/path/to/project/web/src/components/EquipmentCell/EquipmentCell.mock.js'
  )

  // Check the file names
  expect(Object.keys(modelPluralMatchesSingularWithoutList)).toEqual([
    MOCK_PATH,
    TEST_PATH,
    STORY_PATH,
    CELL_PATH,
  ])

  // Check the contents
  expect(modelPluralMatchesSingularWithoutList[CELL_PATH]).toMatchSnapshot()
})
