import path from 'path'

import { fileToAst } from '../ast'
import { getJsxElements } from '../jsx'

const getFixturePath = (relativeFilePath: string) => {
  return path.join(__dirname, `fixtures/${relativeFilePath}`)
}

test('simple jsx tree', () => {
  const simpleAst = fileToAst(getFixturePath('web/src/router/simple.tsx'))
  const elements = getJsxElements(simpleAst, 'Router')
  expect(elements).toMatchInlineSnapshot(`
    Array [
      Object {
        "children": Array [
          Object {
            "children": Array [
              Object {
                "children": Array [],
                "name": "Route",
                "props": Object {
                  "name": "home",
                  "page": "HomePage",
                  "path": "/home",
                },
              },
              Object {
                "children": Array [],
                "name": "Route",
                "props": Object {
                  "name": "login",
                  "page": "LoginPage",
                  "path": "/login",
                },
              },
              Object {
                "children": Array [],
                "name": "Route",
                "props": Object {
                  "name": "404",
                  "page": "ArrowFunctionExpression is not supported",
                  "path": "/404",
                },
              },
            ],
            "name": "Set",
            "props": Object {
              "private": true,
            },
          },
        ],
        "name": "Router",
        "props": Object {},
      },
    ]
  `)
})
