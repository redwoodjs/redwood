import { loadGeneratorFixture } from 'src/lib/test'

import * as cell from '../cell'

let files

beforeAll(() => {
  files = cell.files({ name: 'User' })
})

test('creates a cell component', () => {
  expect(
    files['/path/to/project/web/src/components/UserCell/UserCell.js']
  ).toEqual(loadGeneratorFixture('cell', 'cell.js'))
})

test('creates a cell test', () => {
  expect(
    files['/path/to/project/web/src/components/UserCell/UserCell.test.js']
  ).toEqual(loadGeneratorFixture('cell', 'cell.test.js'))
})
