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

  expect(p).toMatchInlineSnapshot(`
    Array [
      "/web/src/components/NumTodosCell/NumTodosCell.js",
      "/web/src/components/TodoListCell/TodoListCell.js",
    ]
  `)
})

test('finds directory named modules', () => {
  const paths = findDirectoryNamedModules()
  const p = paths.map((p) => p.replace(FIXTURE_PATH, ''))
  expect(p).toMatchInlineSnapshot(`
    Array [
      "/api/src/services/todos/todos.js",
      "/web/src/components/AddTodo/AddTodo.js",
      "/web/src/components/AddTodoControl/AddTodoControl.js",
      "/web/src/components/Check/Check.js",
      "/web/src/components/NumTodosCell/NumTodosCell.js",
      "/web/src/components/TableCell/TableCell.js",
      "/web/src/components/TodoItem/TodoItem.js",
      "/web/src/components/TodoListCell/TodoListCell.js",
      "/web/src/pages/admin/EditUserPage/EditUserPage.jsx",
      "/web/src/pages/FatalErrorPage/FatalErrorPage.js",
      "/web/src/pages/HomePage/HomePage.js",
      "/web/src/pages/NotFoundPage/NotFoundPage.js",
      "/web/src/pages/TypeScriptPage/TypeScriptPage.tsx",
    ]
  `)
})
