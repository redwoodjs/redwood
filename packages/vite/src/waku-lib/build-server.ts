// TODO (RSC) Take ownership of this file and move it out ouf the waku-lib folder
import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { onWarn } from '../lib/onWarn'

export async function serverBuild(
  entriesFile: string,
  clientEntryFiles: Record<string, string>,
  serverEntryFiles: Record<string, string>,
  customModules: Record<string, string>
) {
  // const noExternal = Array.from(clientEntryFileSet).map(
  //   // FIXME this might not work with pnpm
  //   (fname) =>
  //     path
  //       .relative(path.join(config.root, "node_modules"), fname)
  //       .split("/")[0]!
  // );
  //
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
      // Externalize everything except files that have 'use client' in them
      // (this includes packages in node_modules that you use that have
      // 'use client' in them)
      // Files included in `noExternal` are files we want Vite to analyze
      noExternal: Object.values(clientEntryFiles),
      // TODO (RSC) This is the original code from waku. I think we can simplify it as above
      // The code below will for most basic cases just be `[ '..' ]`, which we
      // believe to be overly broad
      // noExternal: Object.values(clientEntryFiles).map((fname) => {
      //   return path
      //     .relative(path.join(rwPaths.base, 'node_modules'), fname)
      //     .split('/')[0]
      // }),
    },
    plugins: [react()],
    resolve: {
      conditions: ['react-server'],
    },
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
        },
      },
    },
  })

  if (!('output' in serverBuildOutput)) {
    throw new Error('Unexpected vite server build output')
  }

  return serverBuildOutput
}
