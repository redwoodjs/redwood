// TODO (RSC) Take ownership of this file and move it out ouf the waku-lib folder
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { onWarn } from '../lib/onWarn'

import { configFileConfig, resolveConfig } from './config'
import {
  shutdown,
  setClientEntries,
  getCustomModulesRSC,
  buildRSC,
} from './rsc-handler'
import { rscIndexPlugin, rscAnalyzePlugin } from './vite-plugin-rsc'

export async function build() {
  const config = await resolveConfig('build')
  const indexHtmlFile = path.join(config.root, config.framework.indexHtml)
  const distEntriesFile = path.join(
    config.root,
    config.build.outDir,
    config.framework.entriesJs
  )
  let entriesFile = path.join(config.root, config.framework.entriesJs)
  if (entriesFile.endsWith('.js')) {
    for (const ext of ['.js', '.ts', '.tsx', '.jsx']) {
      const tmp = entriesFile.slice(0, -3) + ext
      if (fs.existsSync(tmp)) {
        entriesFile = tmp
        break
      }
    }
  }
  const require = createRequire(import.meta.url)

  const customModules = await getCustomModulesRSC()
  const clientEntryFileSet = new Set<string>()
  const serverEntryFileSet = new Set<string>()
  await viteBuild({
    ...configFileConfig,
    plugins: [
      rscAnalyzePlugin(
        (id) => clientEntryFileSet.add(id),
        (id) => serverEntryFileSet.add(id)
      ),
    ],
    ssr: {
      // TODO (RSC): Is this still relevant?
      // FIXME Without this, waku/router isn't considered to have client
      // entries, and "No client entry" error occurs.
      // Unless we fix this, RSC-capable packages aren't supported.
      // This also seems to cause problems with pnpm.
      noExternal: ['waku'],
    },
    build: {
      write: false,
      ssr: true,
      rollupOptions: {
        onwarn: onWarn,
        input: {
          entries: entriesFile,
          ...customModules,
        },
      },
    },
  })
  const clientEntryFiles = Object.fromEntries(
    Array.from(clientEntryFileSet).map((fname, i) => [`rsc${i}`, fname])
  )
  const serverEntryFiles = Object.fromEntries(
    Array.from(serverEntryFileSet).map((fname, i) => [`rsf${i}`, fname])
  )

  const serverBuildOutput = await viteBuild({
    ...configFileConfig,
    ssr: {
      noExternal: Array.from(clientEntryFileSet).map(
        // FIXME this might not work with pnpm
        (fname) =>
          path
            .relative(path.join(config.root, 'node_modules'), fname)
            .split('/')[0]
      ),
    },
    build: {
      ssr: true,
      rollupOptions: {
        onwarn: onWarn,
        input: {
          entries: entriesFile,
          ...clientEntryFiles,
          ...serverEntryFiles,
          ...customModules,
        },
        output: {
          banner: (chunk) => {
            // HACK to bring directives to the front
            let code = ''
            if (chunk.moduleIds.some((id) => clientEntryFileSet.has(id))) {
              code += '"use client";'
            }
            if (chunk.moduleIds.some((id) => serverEntryFileSet.has(id))) {
              code += '"use server";'
            }
            return code
          },
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'entries' || customModules[chunkInfo.name]) {
              return '[name].js'
            }
            return 'assets/[name].js'
          },
        },
      },
    },
  })
  if (!('output' in serverBuildOutput)) {
    throw new Error('Unexpected vite server build output')
  }

  const clientBuildOutput = await viteBuild({
    ...configFileConfig,
    plugins: [react(), rscIndexPlugin()],
    build: {
      outDir: path.join(config.build.outDir, config.framework.outPublic),
      rollupOptions: {
        onwarn: onWarn,
        input: {
          main: indexHtmlFile,
          ...clientEntryFiles,
        },
        preserveEntrySignatures: 'exports-only',
      },
    },
  })
  if (!('output' in clientBuildOutput)) {
    throw new Error('Unexpected vite client build output')
  }

  const clientEntries: Record<string, string> = {}
  for (const item of clientBuildOutput.output) {
    const { name, fileName } = item
    const entryFile =
      name &&
      serverBuildOutput.output.find(
        (item) =>
          'moduleIds' in item &&
          item.moduleIds.includes(clientEntryFiles[name] as string)
      )?.fileName
    if (entryFile) {
      clientEntries[entryFile] = fileName
    }
  }
  console.log('clientEntries', clientEntries)
  fs.appendFileSync(
    distEntriesFile,
    `export const clientEntries=${JSON.stringify(clientEntries)};`
  )

  const absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => [
      path.join(path.dirname(entriesFile), config.build.outDir, key),
      config.base + val,
    ])
  )
  await setClientEntries(absoluteClientEntries)

  await buildRSC()

  const origPackageJson = require(path.join(config.root, 'package.json'))
  const packageJson = {
    name: origPackageJson.name,
    version: origPackageJson.version,
    private: true,
    type: 'module',
    scripts: {
      start: 'waku start',
    },
    dependencies: origPackageJson.dependencies,
  }
  fs.writeFileSync(
    path.join(config.root, config.build.outDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  await shutdown()
}
