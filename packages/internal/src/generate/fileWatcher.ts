import path from 'path'

import chokidar from 'chokidar'

import { isCellFile, isPageFile, isDirectoryNamedModuleFile } from '../files'
import { getPaths } from '../paths'

import {
  generateMirrorCell,
  generateMirrorDirectoryNamedModule,
  generateTypeDefRouterRoutes,
  generateTypeDefRouterPages,
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
  .on('ready', () => {
    console.log('Watching files...')
    console.log(watcher.getWatched())
    // TODO: Generate all the things.
  })
  .on('all', (eventName, p) => {
    p = path.join(rwjsPaths.base, p)

    if (
      eventName === 'add' ||
      eventName === 'change' ||
      eventName == 'unlink'
    ) {
      if (p.indexOf('Cell') !== -1 && isCellFile(p)) {
        // TODO: Delete mirror cell if unlink.
        generateMirrorCell(p, rwjsPaths)
      } else if (p === rwjsPaths.web.routes) {
        generateTypeDefRouterRoutes()
      } else if (p.indexOf('Page') !== -1 && isPageFile(p)) {
        generateTypeDefRouterPages()
      } else if (isDirectoryNamedModuleFile(p)) {
        generateMirrorDirectoryNamedModule(p, rwjsPaths)
      }

      // TODO: GraphQL Schema.
    }
  })
