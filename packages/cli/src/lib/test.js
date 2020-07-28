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
    ...jest.requireActual('@redwoodjs/internal'),
    getPaths: () => {
      const BASE_PATH = '/path/to/project'
      return {
        base: BASE_PATH,
        api: {
          db: path.join(global.__dirname, 'fixtures'), // this folder
          src: path.join(BASE_PATH, './api/src'),
          services: path.join(BASE_PATH, './api/src/services'),
          graphql: path.join(BASE_PATH, './api/src/graphql.js'),
          functions: path.join(BASE_PATH, './api/src/functions'),
          lib: path.join(BASE_PATH, './api/src/lib'),
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
    resolve: () => {
      const BASE_PATH = '/path/to/project'
      return {
        base: BASE_PATH,
        api: {
          db: path.join(global.__dirname, 'fixtures'), // this folder
          src: path.join(BASE_PATH, './api/src'),
          services: path.join(BASE_PATH, './api/src/services'),
          graphql: path.join(BASE_PATH, './api/src/graphql.js'),
          functions: path.join(BASE_PATH, './api/src/functions'),
          lib: path.join(BASE_PATH, './api/src/lib'),
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

global.__prettierPath = path.resolve(
  __dirname,
  './__tests__/fixtures/prettier.config.js'
)
jest.mock('fs', () => {
  const fs = jest.requireActual('fs')

  return {
    ...fs,
    readFileSync: (fileName) => {
      if (fileName === '/path/to/project/web/src/index.js') {
        return '<RedwoodProvider>.*</RedwoodProvider>'
      }
      return 'test'
    },
    writeFileSync: () => {
      return
    },
  }
})
jest.mock('path', () => {
  const path = jest.requireActual('path')

  return {
    ...path,
    join: (...paths) => {
      if (
        paths &&
        paths[0] === '/path/to/project' &&
        paths[1] === 'prettier.config.js'
      ) {
        return global.__prettierPath
      }

      return path.join(...paths)
    },
  }
})

export const generatorsRootPath = path.join(
  __dirname,
  '..',
  'commands',
  'generate'
)

// Loads the fixture for a generator by assuming a lot of the path structure automatically:
//
//   loadGeneratorFixture('scaffold', 'NamePage.js')
//
// will return the contents of:
//
//   cli/src/commands/generate/scaffold/test/fixtures/NamePage.js.fixture
export const loadGeneratorFixture = (generator, name) => {
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

// Returns the contents of a text file suffixed with ".fixture"
export const loadFixture = (filepath) => {
  return fs.readFileSync(filepath).toString()
}
