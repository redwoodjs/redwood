import { build as viteBuild } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

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
    ['entry.server']: entriesFile,
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
      noExternal: ['..'],
    },
    build: {
      ssr: true,
      outDir: rwPaths.web.distServer,
      rollupOptions: {
        input,
        output: {
          banner: (chunk) => {
            // HACK to bring directives to the front
            let code = ''
            const clientKeys = Object.keys(clientEntryFiles)
            if (chunk.moduleIds.some((id) => clientKeys.includes(id))) {
              code += '"use client";'
            }

            const serverKeys = Object.keys(serverEntryFiles)
            if (chunk.moduleIds.some((id) => serverKeys.includes(id))) {
              code += '"use server";'
            }
            return code
          },
          entryFileNames: (chunkInfo) => {
            if (
              // TODO (RSC) Don't hardcode 'entry.server' here
              chunkInfo.name === 'entry.server' ||
              customModules[chunkInfo.name]
            ) {
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
