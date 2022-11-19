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
    [
      {
        "children": [
          {
            "children": [
              {
                "children": [],
                "name": "Route",
                "props": {
                  "name": "home",
                  "page": "HomePage",
                  "path": "/home",
                },
              },
              {
                "children": [],
                "name": "Route",
                "props": {
                  "name": "login",
                  "page": "LoginPage",
                  "path": "/login",
                },
              },
              {
                "children": [],
                "name": "Route",
                "props": {
                  "name": "404",
                  "page": "ArrowFunctionExpression is not supported",
                  "path": "/404",
                },
              },
            ],
            "name": "Set",
            "props": {
              "private": true,
            },
          },
        ],
        "name": "Router",
        "props": {},
      },
    ]
  `)
})
