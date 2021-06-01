import { getJsxElements } from '../jsx'

test('simple jsx tree', () => {
  const code = `
    export const Router = () => {
      return (
        <Router>
          <Set private>
            <Route path={"/" + "home"} name="home" page={HomePage} />
            <Route path="/login" name="login" page={LoginPage} />
            <Route path="/404" name="404" page={() => '404 - Not Found.'} />
          </Set>
        </Router>
      )
    }
  `
  const elements = getJsxElements(code, 'Router')
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
