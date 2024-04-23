import path from 'node:path'

import fs from 'fs-extra'
import { Listr } from 'listr2'
import { format } from 'prettier'

import { addWebPackages, getPrettierOptions } from '@redwoodjs/cli-helpers'
import { getConfig, getPaths, resolveFile } from '@redwoodjs/project-config'

import { runTransform } from '../../../../lib/runTransform'

export async function handler({ force }: { force: boolean }) {
  const rwPaths = getPaths()
  const rootPkgJson = fs.readJSONSync(path.join(rwPaths.base, 'package.json'))
  const currentProjectVersion = rootPkgJson.devDependencies['@redwoodjs/core']

  const tasks = new Listr(
    [
      {
        title: 'Check prerequisites',
        skip: force,
        task: () => {
          if (!getConfig().experimental?.streamingSsr?.enabled) {
            throw new Error(
              'The Streaming SSR experimental feature must be enabled before you can setup middleware',
            )
          }
        },
      },
      addWebPackages([`@redwoodjs/ogimage-gen@${currentProjectVersion}`]),
      {
        title: 'Add OG Image middleware ...',
        task: async () => {
          const graphqlPath = resolveFile(
            path.join(getPaths().api.functions, 'graphql'),
          )

          if (!graphqlPath) {
            throw new Error('Could not find a GraphQL handler in your project.')
          }

          const transformResult = await runTransform({
            transformPath: path.join(__dirname, 'codemod.js'),
            targetPaths: [graphqlPath],
          })

          if (transformResult.error) {
            throw new Error(transformResult.error)
          }

          const source = fs.readFileSync(graphqlPath, 'utf-8')

          const prettierOptions = await getPrettierOptions()

          const prettifiedApp = await format(source, {
            ...prettierOptions,
            parser: 'babel-ts',
          })

          fs.writeFileSync(graphqlPath, prettifiedApp, 'utf-8')
        },
      },
    ],
    { rendererOptions: { collapseSubtasks: false } },
  )

  try {
    await tasks.run()
  } catch (e: any) {
    console.error(e.message)
    process.exit(e?.exitCode || 1)
  }
}
