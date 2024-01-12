import fs from 'node:fs'
import path from 'node:path'

import toml from '@iarna/toml'
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

  const redwoodTomlPath = getConfigPath()
  const redwoodTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
  // Can't type toml.parse because this PR has not been included in a released yet
  // https://github.com/iarna/iarna-toml/commit/5a89e6e65281e4544e23d3dbaf9e8428ed8140e9
  const redwoodTomlObject = toml.parse(redwoodTomlContent) as any

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

          if (redwoodTomlObject?.graphql?.fragments) {
            return 'GraphQL Fragments are already enabled.'
          }

          return false
        },
        task: () => {
          const redwoodTomlPath = getConfigPath()
          const originalTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
          const hasExistingGraphqlSection = !!redwoodTomlObject?.graphql

          let newTomlContent =
            originalTomlContent + '\n\n[graphql]\n  fragments = true'

          if (hasExistingGraphqlSection) {
            const existingGraphqlSetting = Object.keys(
              redwoodTomlObject.graphql
            )

            let inGraphqlSection = false
            let indentation = ''
            let lastGraphqlSettingIndex = 0

            const tomlLines = originalTomlContent.split('\n')
            tomlLines.forEach((line, index) => {
              if (line.startsWith('[graphql]')) {
                inGraphqlSection = true
                lastGraphqlSettingIndex = index
              } else {
                if (/^\s*\[/.test(line)) {
                  inGraphqlSection = false
                }
              }

              if (inGraphqlSection) {
                const matches = line.match(
                  new RegExp(`^(\\s*)(${existingGraphqlSetting})\\s*=`, 'i')
                )

                if (matches) {
                  indentation = matches[1]
                }

                if (/^\s*\w+\s*=/.test(line)) {
                  lastGraphqlSettingIndex = index
                }
              }
            })

            tomlLines.splice(
              lastGraphqlSettingIndex + 1,
              0,
              `${indentation}fragments = true`
            )

            newTomlContent = tomlLines.join('\n')
          }

          fs.writeFileSync(redwoodTomlPath, newTomlContent)
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
          const transformResult = await runTransform({
            transformPath: path.join(__dirname, 'appGqlConfigTransform.js'),
            targetPaths: [getPaths().web.app],
          })

          if (transformResult.error) {
            throw new Error(transformResult.error)
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
