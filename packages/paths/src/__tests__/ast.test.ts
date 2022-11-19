import path from 'path'

import {
  getGqlQueries,
  getNamedExports,
  hasDefaultExport,
  getCellGqlQuery,
  fileToAst,
} from '../ast'

jest.mock('../paths', () => {
  const path = require('path')
  const baseFixturePath = path.join(__dirname, 'fixtures')
  return {
    getPaths: () => ({
      base: baseFixturePath,
      web: {
        src: path.join(baseFixturePath, 'web/src'),
        base: path.join(baseFixturePath, 'web'),
      },
      api: {
        src: path.join(baseFixturePath, 'api/src'),
        base: path.join(baseFixturePath, 'api'),
      },
    }),
  }
})

const getFixturePath = (relativeFilePath: string) => {
  return path.join(__dirname, `fixtures/${relativeFilePath}`)
}

test('extracts named exports', () => {
  // Fixture is in web folder, because it has a JSX export
  const fakeCode = fileToAst(getFixturePath('/web/src/exports.ts'))
  const n = getNamedExports(fakeCode)
  expect(n).toMatchInlineSnapshot(`
    [
      {
        "name": "exportA",
        "type": "re-export",
      },
      {
        "name": "exportB",
        "type": "re-export",
      },
      {
        "name": "myVariableExport",
        "type": "variable",
      },
      {
        "name": "myArrowFunctionExport",
        "type": "variable",
      },
      {
        "name": "myFunctionExport",
        "type": "function",
      },
      {
        "name": "MyClassExport",
        "type": "class",
      },
    ]
  `)
})

test('tests default exports', () => {
  expect(
    hasDefaultExport(fileToAst(getFixturePath('/defaultExports/multiLine.js')))
  ).toEqual(true)

  expect(
    hasDefaultExport(fileToAst(getFixturePath('defaultExports/singleLine.js')))
  ).toEqual(true)

  expect(
    hasDefaultExport(fileToAst(getFixturePath('defaultExports/none.js')))
  ).toEqual(false)
})

test('Returns the exported query from a cell (ignoring others)', () => {
  const cellFileAst = fileToAst(getFixturePath('web/src/cell.ts'))

  const cellQuery = getCellGqlQuery(cellFileAst)
  expect(cellQuery).toMatchInlineSnapshot(`
    "
      query BazingaQuery($id: String!) {
        member: member(id: $id) {
          id
        }
      }
    "
  `)
})

test('Returns the all quries from a file using getGqlQueries', () => {
  const cellFileAst = fileToAst(getFixturePath('web/src/cell.ts'))

  const cellQuery = getGqlQueries(cellFileAst)
  expect(cellQuery).toMatchInlineSnapshot(`
    [
      "
      query BazingaQuery($id: String!) {
        member: member(id: $id) {
          id
        }
      }
    ",
      "
    query FindSoftKitten($id: String!) {
        softKitten: softKitten(id: $id) {
          id
        }
      }
    ",
      "query JustForFun {
      itsFriday {}
    }",
    ]
  `)
})

test('Handles typecast syntax without erroring', () => {
  expect(() => fileToAst(getFixturePath('api/typecast.ts'))).not.toThrow()
})
