import path from 'path'

import chokidar from 'chokidar'

import {
  getPaths,
  isCellFile,
  isPageFile,
  generateMirrorCell,
  generateTypeDefRouterRoutes,
  generateTypeDefRouterPages,
} from '@redwoodjs/internal'

const rwjsPaths = getPaths()

const watcher = chokidar.watch('**/src/**/*.{ts,js,jsx,tsx}', {
  persistent: true,
  ignored: ['node_modules', '.redwood'],
  ignoreInitial: true,
  cwd: rwjsPaths.base,
  awaitWriteFinish: true,
})

// TODO: Make this emit our own events so that it can be used programatically in the CLI.
// TODO: Move this into internal.
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
        generateMirrorCell(p)
      } else if (p === rwjsPaths.web.routes) {
        generateTypeDefRouterRoutes()
      } else if (p.indexOf('Page') !== -1 && isPageFile(p)) {
        generateTypeDefRouterPages()
      }
      // TODO: directory-named-modules.
      // TODO: GraphQL Schema.
    }
  })

//watcher.close().then(() => console.log('closed'))
