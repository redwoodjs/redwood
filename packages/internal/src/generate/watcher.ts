import fs from 'fs'
import path from 'path'

import chokidar from 'chokidar'

import {
  isCellFile,
  isPageFile,
  isDirectoryNamedModuleFile,
  isGraphQLSchemaFile,
} from '../files'
import { getPaths } from '../paths'

import { generate } from './generate'
import { generateGraphQLSchema } from './graphqlSchema'
import {
  generateMirrorCell,
  generateMirrorDirectoryNamedModule,
  generateTypeDefRouterRoutes,
  generateTypeDefRouterPages,
  mirrorPathForDirectoryNamedModules,
  mirrorPathForCell,
  generateTypeDefGraphQL,
} from './typeDefinitions'

// TODO: Make this emit our own events so that it can be used programatically in the CLI.

const rwjsPaths = getPaths()

const watcher = chokidar.watch('**/src/**/*.{ts,js,jsx,tsx}', {
  persistent: true,
  ignored: ['node_modules', '.redwood'],
  ignoreInitial: true,
  cwd: rwjsPaths.base,
  awaitWriteFinish: true,
})

watcher
  .on('ready', async () => {
    console.log('Watching files...')
    console.log(watcher.getWatched())
    const files = await generate()
  })
  .on('all', async (eventName, p) => {
    p = path.join(rwjsPaths.base, p)

    if (
      eventName === 'add' ||
      eventName === 'change' ||
      eventName == 'unlink'
    ) {
      if (p.indexOf('Cell') !== -1 && isCellFile(p)) {
        if (eventName === 'unlink') {
          fs.unlinkSync(mirrorPathForCell(p, rwjsPaths)[0])
        } else {
          generateMirrorCell(p, rwjsPaths)
        }
        generateTypeDefGraphQL('web')
      } else if (p === rwjsPaths.web.routes) {
        generateTypeDefRouterRoutes()
      } else if (p.indexOf('Page') !== -1 && isPageFile(p)) {
        generateTypeDefRouterPages()
      } else if (isDirectoryNamedModuleFile(p)) {
        if (eventName === 'unlink') {
          fs.unlinkSync(mirrorPathForDirectoryNamedModules(p, rwjsPaths)[0])
        } else {
          generateMirrorDirectoryNamedModule(p, rwjsPaths)
        }
      } else if (isGraphQLSchemaFile(p)) {
        await generateGraphQLSchema()
        await generateTypeDefGraphQL('api')
      }
    }
  })
