import fs from 'fs'

import assert from 'node:assert/strict'
import { test } from 'node:test'

test('transform', async (t) => {
  // Have to import like this because ../index isn't a module
  const { transform } = await import('../index')

  t.mock.method(fs, 'readFileSync', () => {
    return '<Router><Route path="/" page={HomePage} name="home" /></Router>'
  })

  t.mock.method(fs, 'existsSync', () => true)

  assert.equal(
    await transform('Router.jsx'),
    '/* @__PURE__ */ React.createElement(Router, null, /* @__PURE__ */ React.createElement(Route, { path: "/", page: HomePage, name: "home" }));\n'
  )
})
