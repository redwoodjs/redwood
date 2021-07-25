import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'

import babelMockCellData from '../babel-plugin-redwood-mock-cell-data'

const transform = (filename: string) => {
  const code = fs.readFileSync(filename, 'utf-8')
  return babel.transform(code, {
    filename,

    plugins: [babelMockCellData],
  })
}

describe('babel plugin redwood mock cell data', () => {
  const FIXTURE_PATH = path.resolve(
    __dirname,
    '../../../../../../__fixtures__/example-todo-main/'
  )

  test('cell with afterQuery', () => {
    const todoListCellMockPath = path.join(
      FIXTURE_PATH,
      'web/src/components/TodoListCell/TodoListCell.mock.js'
    )
    const result = transform(todoListCellMockPath)
    expect(result.code).toMatchInlineSnapshot(`
"import { afterQuery } from \\"./TodoListCell.tsx\\";
export const standard = () => afterQuery(mockGraphQLQuery(\\"TodoListCell_GetTodos\\", () => ({
  todos: [{
    id: 1,
    body: 'Cheese',
    status: ''
  }]
}))());"
`)
  })

  test('cell without afterQuery', () => {
    const NumTodosCellMockPath = path.join(
      FIXTURE_PATH,
      'web/src/components/NumTodosCell/NumTodosCell.mock.js'
    )
    const result = transform(NumTodosCellMockPath)
    expect(result.code).toMatchInlineSnapshot(`
"export const standard = mockGraphQLQuery(\\"NumTodosCell_GetCount\\", {
  todosCount: 42
});"
`)
  })
})
