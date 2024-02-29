import path from 'node:path'

import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

import { onWarn } from '../lib/onWarn'

import { rscTransformPlugin } from './rscVitePlugins'

/**
 * RSC build. Step 3.
 * buildFeServer -> buildRscFeServer -> buildForRscServer
 * Generate the output to be used by the rsc worker (not the actual server!)
 */
// @TODO(RSC_DC): no redwood-vite plugin, add it back in here
export async function buildForRscServer(
  clientEntryFiles: Record<string, string>,
  serverEntryFiles: Record<string, string>,
  customModules: Record<string, string>
) {
  const rwPaths = getPaths()

  if (!rwPaths.web.entries) {
    throw new Error('RSC entries file not found')
  }

  console.log('\n')
  console.log('3. rscBuildServer')
  console.log('=================\n')

  const input = {
    entries: rwPaths.web.entries,
    ...clientEntryFiles,
    ...serverEntryFiles,
    ...customModules,
  }

  const rscServerBuildOutput = await viteBuild({
    envFile: false,
    legacy: {
      // @MARK: for the worker, we're building ESM! (not CJS)
      buildSsrCjsExternalHeuristics: false,
    },
    ssr: {
      // Externalize everything except packages with files that have
      // 'use client' in them (which are the files in `clientEntryFiles`)
      // Files included in `noExternal` are files we want Vite to analyze
      // The values in the array here are compared to npm package names, like
      // 'react', 'core-js', @anthropic-ai/sdk', @redwoodjs/vite', etc
      // The map function below will return '..' for local files. That's not
      // very pretty, but it works. It just won't match anything.
      noExternal: Object.values(clientEntryFiles).map((fullPath) => {
        // On Windows `fullPath` will be something like
        // D:/a/redwood/test-project-rsc-external-packages/node_modules/@tobbe.dev/rsc-test/dist/rsc-test.es.js
        const relativePath = path.relative(
          path.join(rwPaths.base, 'node_modules'),
          fullPath
        )
        // On Windows `relativePath` will be something like
        // @tobbe.dev\rsc-test\dist\rsc-test.es.js
        // So `splitPath` will in this case become
        // ['@tobbe.dev', 'rsc-test', 'dist', 'rsc-test.es.js']
        const splitPath = relativePath.split(path.sep)

        // Packages without scope. Full package name looks like: package_name
        let packageName = splitPath[0]

        // Handle scoped packages. Full package name looks like:
        // @org_name/package_name
        if (splitPath[0].startsWith('@')) {
          // join @org_name with package_name
          packageName = path.join(splitPath[0], splitPath[1])
        }

        console.log('noExternal fullPath', fullPath, 'packageName', packageName)

        return packageName
      }),
      resolve: {
        externalConditions: ['react-server'],
      },
    },
    plugins: [
      // The rscTransformPlugin maps paths like
      // /Users/tobbe/.../rw-app/node_modules/@tobbe.dev/rsc-test/dist/rsc-test.es.js
      // to
      // /Users/tobbe/.../rw-app/web/dist/server/assets/rsc0.js
      // That's why it needs the `clientEntryFiles` data
      // (It does other things as well, but that's why it needs clientEntryFiles)
      rscTransformPlugin(clientEntryFiles),
      react({
        babel: {
          ...getWebSideDefaultBabelConfig({
            forVite: true,
            forRscClient: false,
          }),
        },
      }),
    ],
    build: {
      ssr: true,
      ssrEmitAssets: true,
      outDir: rwPaths.web.distRsc,
      emptyOutDir: true, // Needed because `outDir` is not inside `root`
      manifest: 'server-build-manifest.json',
      rollupOptions: {
        onwarn: onWarn,
        input,
        output: {
          banner: (chunk) => {
            // HACK to bring directives to the front
            let code = ''
            const clientValues = Object.values(clientEntryFiles)
            console.log('chunk.moduleIds', chunk.moduleIds)
            console.log('clientValues', clientValues)
            if (chunk.moduleIds.some((id) => clientValues.includes(id))) {
              console.log('adding "use client" to', chunk.fileName)
              code += '"use client";'
            }

            const serverValues = Object.values(serverEntryFiles)
            console.log('serverValues', serverValues)
            if (chunk.moduleIds.some((id) => serverValues.includes(id))) {
              console.log('adding "use server" to', chunk.fileName)
              code += '"use server";'
            }
            return code
          },
          entryFileNames: (chunkInfo) => {
            // TODO (RSC) Probably don't want 'entries'. And definitely don't want it hardcoded
            if (chunkInfo.name === 'entries' || customModules[chunkInfo.name]) {
              return '[name].js'
            }
            return 'assets/[name].js'
          },
          // This is not ideal. See
          // https://rollupjs.org/faqs/#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting
          // But we need it to prevent `import 'client-only'` from being
          // hoisted into App.tsx
          // TODO (RSC): Fix when https://github.com/rollup/rollup/issues/5235
          // is resolved
          hoistTransitiveImports: false,
        },
      },
    },
  })

  if (!('output' in rscServerBuildOutput)) {
    throw new Error('Unexpected rsc server build output')
  }

  return rscServerBuildOutput.output
}
