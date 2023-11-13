// TODO (RSC) Take ownership of this file and move it out ouf the waku-lib folder
import path from 'node:path'

import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { onWarn } from '../lib/onWarn'

// This is part of step 3. It's invoked from ./buildRscFeServer
export async function serverBuild(
  entriesFile: string,
  clientEntryFiles: Record<string, string>,
  serverEntryFiles: Record<string, string>,
  customModules: Record<string, string>
) {
  const input = {
    entries: entriesFile,
    ...clientEntryFiles,
    ...serverEntryFiles,
    ...customModules,
  }

  console.log('input', input)

  const rwPaths = getPaths()

  const serverBuildOutput = await viteBuild({
    // ...configFileConfig,
    root: rwPaths.web.base,
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

        // Packages without scope. Package name looks like: package_name
        let packageName = splitPath[0]

        // Handle scoped packages. Full package name looks like:
        // @org_name/package_name
        if (splitPath[0].startsWith('@')) {
          // join @org_name with package_name
          packageName = path.join(splitPath[0], splitPath[1])
        }

        console.log('noExternal packageName', packageName)

        return packageName
      }),
      resolve: {
        externalConditions: ['react-server'],
      },
    },
    plugins: [react()],
    build: {
      ssr: true,
      ssrEmitAssets: true,
      // TODO (RSC) Change output dir to just dist. We should be "server
      // first". Client components are the "special case" and should be output
      // to dist/client
      outDir: rwPaths.web.distServer,
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

  if (!('output' in serverBuildOutput)) {
    throw new Error('Unexpected vite server build output')
  }

  return serverBuildOutput
}
