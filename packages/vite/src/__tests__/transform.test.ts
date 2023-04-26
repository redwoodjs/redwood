import { transform } from '../index'

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    readFileSync: () =>
      '<Router><Route path="/" page={HomePage} name="home" /></Router>',
    existsSync: () => true,
  }
})

test('transform', async () => {
  expect(await transform('Router.jsx')).toEqual(
    '/* @__PURE__ */ React.createElement(Router, null, /* @__PURE__ */ React.createElement(Route, { path: "/", page: HomePage, name: "home" }));\n'
  )
})
