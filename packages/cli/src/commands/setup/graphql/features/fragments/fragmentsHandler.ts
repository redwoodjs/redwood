import fs from 'node:fs'
import path from 'node:path'

import execa from 'execa'
import { Listr } from 'listr2'
import { format } from 'prettier'

import {
  colors,
  recordTelemetryAttributes,
  prettierOptions,
} from '@redwoodjs/cli-helpers'
import { getConfigPath, getPaths } from '@redwoodjs/project-config'

import type { Args } from './fragments'
import { runTransform } from './runTransform'

export const command = 'fragments'
export const description = 'Set up Fragments for GraphQL'

export async function handler({ force }: Args) {
  recordTelemetryAttributes({
    command: 'setup graphql fragments',
    force,
  })

  const tasks = new Listr(
    [
      {
        title:
          'Update Redwood Project Configuration to enable GraphQL Fragments',
        skip: () => {
          if (force) {
            // Never skip when --force is used
            return false
          }

          const redwoodTomlPath = getConfigPath()
          const redwoodTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
          if (/\bfragments\s*=\s*true/.test(redwoodTomlContent)) {
            return 'GraphQL Fragments are already enabled.'
          }

          return false
        },
        task: () => {
          const redwoodTomlPath = getConfigPath()
          const originalTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

          const tomlToAppend = `[graphql]\n  fragments = true`

          const newConfig = originalTomlContent + '\n' + tomlToAppend

          fs.writeFileSync(redwoodTomlPath, newConfig, 'utf-8')
        },
      },
      {
        title: 'Generate possibleTypes.ts',
        task: () => {
          execa.commandSync('yarn redwood generate types', { stdio: 'ignore' })
        },
      },
      {
        title: 'Import possibleTypes in App.tsx',
        task: () => {
          return runTransform({
            transformPath: path.join(__dirname, 'appImportTransform.js'),
            targetPaths: [getPaths().web.app],
          })
        },
      },
      {
        title: 'Add possibleTypes to the GraphQL cache config',
        task: async () => {
          const result = await runTransform({
            transformPath: path.join(__dirname, 'appGqlConfigTransform.js'),
            targetPaths: [getPaths().web.app],
          })

          if (result.error) {
            throw new Error(result.error)
          }

          const appPath = getPaths().web.app
          const source = fs.readFileSync(appPath, 'utf-8')

          const prettifiedApp = format(source, {
            ...prettierOptions(),
            parser: 'babel-ts',
          })

          fs.writeFileSync(getPaths().web.app, prettifiedApp, 'utf-8')
        },
      },
    ],
    { rendererOptions: { collapseSubtasks: false } }
  )

  try {
    await tasks.run()
  } catch (e: any) {
    console.error(colors.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
