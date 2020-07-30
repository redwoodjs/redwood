const path = require('path')

const { toMatchFile } = require('jest-file-snapshot')

global.FIXTURE_PATH = path.resolve(
  __dirname,
  '../../__fixtures__/example-todo-main'
)

global.stripFixturePath = (p) => p.replace(global.FIXTURE_PATH, '')

expect.extend({
  toMatchFile,
})
