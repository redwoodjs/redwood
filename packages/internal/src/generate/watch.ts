#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

import chokidar from 'chokidar'
import fse from 'fs-extra'

import {
  isCellFile,
  isDirectoryNamedModuleFile,
  isGraphQLSchemaFile,
  isFileInsideFolder,
} from '../files'
import { getPaths } from '../paths'

import { generate } from './generate'
import {
  generateTypeDefGraphQLApi,
  generateTypeDefGraphQLWeb,
} from './graphqlCodeGen'
import { generateGraphQLSchema } from './graphqlSchema'
import {
  generateMirrorCell,
  generateMirrorDirectoryNamedModule,
  generateTypeDefRouterRoutes,
  generateTypeDefRouterPages,
  mirrorPathForDirectoryNamedModules,
  mirrorPathForCell,
} from './typeDefinitions'

// Can't use `isPageFile()` from ../files because that ones looks at the
// content of the file, and that doesn't work for deleted files that we
// sometimes have in the watcher callback
function isPageFile(p: string) {
  const { name } = path.parse(p)

  // A page must end with "Page.{jsx,js,tsx}".
  if (!name.endsWith('Page')) {
    return false
  }

  // A page should be in the `web/src/pages` directory.
  if (!isFileInsideFolder(p, getPaths().web.pages)) {
    return false
  }

  return true
}

const rwjsPaths = getPaths()

const action = {
  add: 'Created',
  unlink: 'Deleted',
  unlinkDir: 'Deleted',
  change: 'Modified',
}

const apiWatcher = chokidar.watch('src/**/*.{ts,js}', {
  persistent: true,
  ignored: ['node_modules', '.redwood'],
  ignoreInitial: true,
  cwd: rwjsPaths.api.base,
  awaitWriteFinish: true,
})

const dirWatcher = chokidar.watch('src', {
  cwd: rwjsPaths.web.base,
  ignoreInitial: true,
  awaitWriteFinish: true,
})

apiWatcher.on('all', async (eventName, p) => {
  if (!['add', 'change', 'unlink'].includes(eventName)) {
    return
  }

  eventName = eventName as 'add' | 'change' | 'unlink'

  const absPath = path.join(rwjsPaths.api.base, p)

  if (isDirectoryNamedModuleFile(absPath)) {
    if (eventName === 'unlink') {
      try {
        fs.unlinkSync(mirrorPathForDirectoryNamedModules(absPath, rwjsPaths)[0])

        console.log(
          action[eventName],
          'Directory named module:',
          '\x1b[2m',
          p,
          '\x1b[0m'
        )
      } catch {
        // Ignoring any errors for the same reasons as for Cell
      }
    } else {
      generateMirrorDirectoryNamedModule(absPath, rwjsPaths)

      console.log(
        action[eventName],
        'Directory named module:',
        '\x1b[2m',
        p,
        '\x1b[0m'
      )
    }
  } else if (isGraphQLSchemaFile(absPath)) {
    await generateGraphQLSchema()
    await generateTypeDefGraphQLApi()
    console.log(action[eventName], 'GraphQL Schema:', '\x1b[2m', p, '\x1b[0m')
  }
})

dirWatcher
  .on('ready', async () => {
    console.log('Generating TypeScript definitions and GraphQL schemas...')
    const files = await generate()
    console.log(files.length, 'files generated')
  })
  .on('all', async (eventName, p) => {
    if (!['add', 'change', 'unlink', 'unlinkDir'].includes(eventName)) {
      return
    }

    eventName = eventName as 'add' | 'change' | 'unlink' | 'unlinkDir'

    const absPath = path.join(rwjsPaths.web.base, p)

    if (eventName === 'unlinkDir') {
      if (absPath.endsWith('Cell')) {
        const mirrorDir = path.join(
          rwjsPaths.generated.types.mirror,
          path.relative(rwjsPaths.base, p)
        )

        try {
          fse.remove(mirrorDir)
        } catch {
          // Ignore
        }
      }

      return
    }

    if (eventName === 'unlink') {
      // When unlinking (i.e. removing or renaming) a file we can't use
      // `isCellFile()` because that function needs to look inside the file to
      // determine if it's a cell or not, and it can't do that on a file that
      // doesn't exist anymore

      const { name } = path.parse(p)

      if (name.endsWith('Cell')) {
        // Probably a cell, but we can never be sure. But if it was indeed a
        // cell it should have had a mirror cell that we now need to remove
        try {
          fs.unlinkSync(mirrorPathForCell(absPath, rwjsPaths)[0])

          console.log(action[eventName], 'Cell:', '\x1b[2m', p, '\x1b[0m')
        } catch {
          // Unlinking will fail if the mirror cell doesn't exist. Just ignore
          // the exception in that case.
          // Unlinking can also fail, especially on Windows, if the file is
          // open somewhere, like in some editor window. Let's just ignore that
          // as well for now
        }
      }
    }

    if (eventName !== 'unlink' && isCellFile(absPath)) {
      await generateTypeDefGraphQLWeb()
      generateMirrorCell(absPath, rwjsPaths)

      console.log(action[eventName], 'Cell:', '\x1b[2m', p, '\x1b[0m')
    } else if (absPath === rwjsPaths.web.routes) {
      generateTypeDefRouterRoutes()
      console.log(action[eventName], 'Routes:', '\x1b[2m', p, '\x1b[0m')
    } else if (isPageFile(absPath)) {
      generateTypeDefRouterPages()
      console.log(action[eventName], 'Page:', '\x1b[2m', p, '\x1b[0m')
    } else if (isDirectoryNamedModuleFile(absPath)) {
      // Remember that files ending with Cell can also be just a regular
      // Directory Named Module, for example <TableCell> used as wrapper for
      // simple <td>s. If <TableCell> lived in /TableCell/TableCell.tsx it'd
      // be a Directory Named Module and it's mirror needs to be deleted

      if (eventName === 'unlink') {
        try {
          fs.unlinkSync(
            mirrorPathForDirectoryNamedModules(absPath, rwjsPaths)[0]
          )

          console.log(
            action[eventName],
            'Directory named module:',
            '\x1b[2m',
            p,
            '\x1b[0m'
          )
        } catch {
          // Ignoring any errors for the same reasons as for Cell
        }
      } else {
        generateMirrorDirectoryNamedModule(absPath, rwjsPaths)

        console.log(
          action[eventName],
          'Directory named module:',
          '\x1b[2m',
          p,
          '\x1b[0m'
        )
      }
    }
  })
