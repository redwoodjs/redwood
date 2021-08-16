global.__dirname = __dirname
// import path from 'path'

// Shared mocks for paths, etc.
import '../../../../lib/test'

import * as cellStates from '../cellStates'

let allCellStateFiles
//   multiWordDefaultFiles,
//   javascriptFiles,
//   typescriptFiles,
//   withoutTestFiles,
//   withoutStoryFiles

beforeAll(() => {
  allCellStateFiles = cellStates.files({
    empty: true,
    failure: true,
    loading: true,
    tests: true,
    stories: true,
  })
})

test('returns exactly 9 files', () => {
  expect(Object.keys(allCellStateFiles).length).toEqual(9)
})

// @todo tests individual states, typescript, and that files actually exist
