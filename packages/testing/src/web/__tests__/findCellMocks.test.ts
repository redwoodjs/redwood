import path from 'path'

import { ensurePosixPath } from '@redwoodjs/internal/dist/paths'

import { findCellMocks } from '../findCellMocks'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../../__fixtures__/example-todo-main'
)

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

test('Finds cell mocks from example-todo', () => {
  const mockPaths = findCellMocks(FIXTURE_PATH).map(cleanPaths)

  expect(mockPaths).toEqual([
    'web/src/components/NumTodosCell/NumTodosCell.mock.js',
    'web/src/components/NumTodosTwoCell/NumTodosTwoCell.mock.js',
    'web/src/components/TodoListCell/TodoListCell.mock.js',
  ])
})
