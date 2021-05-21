import path from 'path'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

beforeAll(() => {
  process.env.__REDWOOD__CONFIG_PATH = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.__REDWOOD__CONFIG_PATH
})

import { findCells, findDirectoryNamedModules } from '../findFiles'

test('finds all the cells', () => {
  const paths = findCells()

  const p = paths.map((p) => p.replace(FIXTURE_PATH, ''))

  expect(p[0]).toContain('NumTodosCell.js')
  expect(p[1]).toContain('TodoListCell.tsx')
})

test('finds directory named modules', () => {
  const paths = findDirectoryNamedModules()
  const p = paths.map((p) => p.replace(FIXTURE_PATH, ''))

  expect(p[0]).toContain('todos.js')
  expect(p[1]).toContain('AddTodo.js')
  expect(p[2]).toContain('AddTodoControl.js')
})
