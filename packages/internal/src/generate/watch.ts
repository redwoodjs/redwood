#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

import chokidar from 'chokidar'

import { getPaths } from '@redwoodjs/paths'

import {
  isCellFile,
  isPageFile,
  isDirectoryNamedModuleFile,
  isGraphQLSchemaFile,
} from '../files'
import { warningForDuplicateRoutes } from '../routes'

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

const rwjsPaths = getPaths()

const watcher = chokidar.watch('**/src/**/*.{ts,js,jsx,tsx}', {
  persistent: true,
  ignored: ['node_modules', '.redwood'],
  ignoreInitial: true,
  cwd: rwjsPaths.base,
  awaitWriteFinish: true,
})

const action = {
  add: 'Created',
  unlink: 'Deleted',
  change: 'Modified',
}

let routesWarningMessage = ''

process.stdin.on('data', async (data) => {
  const str = data.toString().trim().toLowerCase()
  if (str === 'g' || str === 'rs') {
    console.log('Regenerating types and schemas....')
    await generate()
  }
})

watcher
  .on('ready', async () => {
    console.log('Generating TypeScript definitions and GraphQL schemas...')
    const files = await generate()
    console.log(files.length, 'files generated')
    routesWarningMessage = warningForDuplicateRoutes()
    if (routesWarningMessage) {
      console.warn(routesWarningMessage)
    }
  })
  .on('all', async (eventName, p) => {
    if (!['add', 'change', 'unlink'].includes(eventName)) {
      return
    }
    eventName = eventName as 'add' | 'change' | 'unlink'

    const absPath = path.join(rwjsPaths.base, p)

    if (absPath.indexOf('Cell') !== -1 && isCellFile(absPath)) {
      await generateTypeDefGraphQLWeb()
      if (eventName === 'unlink') {
        fs.unlinkSync(mirrorPathForCell(absPath, rwjsPaths)[0])
      } else {
        generateMirrorCell(absPath, rwjsPaths)
      }

      console.log(action[eventName], 'Cell:', '\x1b[2m', p, '\x1b[0m')
    } else if (absPath === rwjsPaths.web.routes) {
      generateTypeDefRouterRoutes()
      routesWarningMessage = warningForDuplicateRoutes()
      console.log(action[eventName], 'Routes:', '\x1b[2m', p, '\x1b[0m')
    } else if (absPath.indexOf('Page') !== -1 && isPageFile(absPath)) {
      generateTypeDefRouterPages()
      console.log(action[eventName], 'Page:', '\x1b[2m', p, '\x1b[0m')
    } else if (isDirectoryNamedModuleFile(absPath)) {
      if (eventName === 'unlink') {
        fs.unlinkSync(mirrorPathForDirectoryNamedModules(absPath, rwjsPaths)[0])
      } else {
        generateMirrorDirectoryNamedModule(absPath, rwjsPaths)
      }
      console.log(
        action[eventName],
        'Directory named module:',
        '\x1b[2m',
        p,
        '\x1b[0m'
      )
    } else if (isGraphQLSchemaFile(absPath)) {
      await generateGraphQLSchema()
      await generateTypeDefGraphQLApi()
      console.log(action[eventName], 'GraphQL Schema:', '\x1b[2m', p, '\x1b[0m')
    }

    if (routesWarningMessage) {
      console.warn(routesWarningMessage)
    }
  })
