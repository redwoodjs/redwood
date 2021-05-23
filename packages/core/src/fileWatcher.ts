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
//

// This code allows you to "watch a glob of files"

// when a file is deleted, modified or added we trigger a function in response
// to that.

// Initialize watcher.

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

    // We should generate all the files here?
  })
  .on('all', (eventName, p) => {
    // TODO: Routes
    p = path.join(rwjsPaths.base, p)

    if (eventName === 'add' || eventName === 'change') {
      if (p.indexOf('Cell') !== -1 && isCellFile(p)) {
        const x = generateMirrorCell(p)
        console.log(p, x)
      } else if (p === rwjsPaths.web.routes) {
        // generate router
        generateTypeDefRouterRoutes()
      } else if (p.indexOf('Page') !== -1 && isPageFile(p)) {
        generateTypeDefRouterPages()
      }
    }

    //if (eventName === 'add' && eventName === '')

    //console.log('x', x)

    // If this is a pages file, generate page imports

    // If this is the route file (generate routes)
  })

//watcher.close().then(() => console.log('closed'))
