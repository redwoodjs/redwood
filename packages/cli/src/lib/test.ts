// Include at the top of your tests. Automatically mocks out the file system
//
// import { loadComponentFixture } from 'src/lib/test'
//
// test('true is true', () => {
//   expect('some output').toEqual(loadComponentFixture('component', 'filename.js'))
// })

import fs from 'fs'
import path from 'path'

jest.mock('@redwoodjs/internal', () => {
  const path = require('path')
  return {
    ...require.requireActual('@redwoodjs/internal'),
    getPaths: () => {
      const BASE_PATH = '/path/to/project'
      return {
        base: BASE_PATH,
        api: {
          db: path.join(global.__dirname, 'fixtures'), // this folder
          src: path.join(BASE_PATH, './api/src'),
          services: path.join(BASE_PATH, './api/src/services'),
          graphql: path.join(BASE_PATH, './api/src/graphql'),
          functions: path.join(BASE_PATH, './api/src/functions'),
        },
        web: {
          src: path.join(BASE_PATH, './web/src'),
          routes: path.join(BASE_PATH, 'web/src/Routes.js'),
          components: path.join(BASE_PATH, '/web/src/components'),
          layouts: path.join(BASE_PATH, '/web/src/layouts'),
          pages: path.join(BASE_PATH, '/web/src/pages'),
        },
      }
    },
  }
})

export const generatorsRootPath = path.join(
  __dirname,
  '..',
  'commands',
  'generate'
)

// Returns the contents of a text file suffixed with ".fixture"
export const loadFixture = (filepath: string) => {
  return fs.readFileSync(filepath).toString()
}

// Loads the fixture for a generator by assuming a lot of the path structure automatically:
//
//   loadGeneratorFixture('scaffold', 'NamePage.js')
//
// will return the contents of:
//
//   cli/src/commands/generate/scaffold/test/fixtures/NamePage.js.fixture
export const loadGeneratorFixture = (generator: string, name: string) => {
  return loadFixture(
    path.join(
      __dirname,
      '..',
      'commands',
      'generate',
      generator,
      '__tests__',
      'fixtures',
      name
    )
  )
}
