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

import { findCells } from '../findFiles'

test('it finds all the cells', () => {
  const paths = findCells()

  const p = paths.map((p) => p.replace(FIXTURE_PATH, ''))
  expect(p).toMatchInlineSnapshot(`
    Array [
      "/web/src/components/NumTodosCell/NumTodosCell.js",
      "/web/src/components/TodoListCell/TodoListCell.js",
    ]
  `)
})
