#!/usr/bin/env node

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
    console.log()
    console.log('Generating...')
    console.log()

    const files = await generate()
    for (const f of files) {
      console.log('  -', f.replace(rwjsPaths.base, '')?.substring(1))
    }
  })
  .on('all', async (eventName, p) => {
    if (!['add', 'change', 'unlink'].includes(eventName)) {
      return
    }

    p = path.join(rwjsPaths.base, p)

    if (p.indexOf('Cell') !== -1 && isCellFile(p)) {
      console.log('Cell:', p)

      const f1 = await generateTypeDefGraphQL('web')
      f1.map((f) => console.log(' -', f))
      if (eventName === 'unlink') {
        fs.unlinkSync(mirrorPathForCell(p, rwjsPaths)[0])
      } else {
        const f = generateMirrorCell(p, rwjsPaths)
        console.log(' -', f)
      }
    } else if (p === rwjsPaths.web.routes) {
      console.log('Routes:', p)
      generateTypeDefRouterRoutes().map((f) => console.log(' -', f))
    } else if (p.indexOf('Page') !== -1 && isPageFile(p)) {
      console.log('Page:', p)
      generateTypeDefRouterPages().map((f) => console.log(' -', f))
    } else if (isDirectoryNamedModuleFile(p)) {
      console.log('Directory named module:', p)
      if (eventName === 'unlink') {
        fs.unlinkSync(mirrorPathForDirectoryNamedModules(p, rwjsPaths)[0])
      } else {
        const f = generateMirrorDirectoryNamedModule(p, rwjsPaths)
        console.log(' -', f)
      }
    } else if (isGraphQLSchemaFile(p)) {
      console.log('GraphQL schema:', p)
      const f1 = await generateGraphQLSchema()
      if (f1) {
        console.log(' -', f1)
      }
      const f2 = await generateTypeDefGraphQL('api')
      f2.map((f) => console.log(' -', f))
    }
  })
