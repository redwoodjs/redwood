import fs from 'node:fs'
import path from 'node:path'

import toml from '@iarna/toml'
import execa from 'execa'
import { Listr } from 'listr2'
import { format } from 'prettier'

import { prettierOptions } from '@redwoodjs/cli-helpers'
import { getConfigPath, getPaths } from '@redwoodjs/project-config'

import { runTransform } from '../fragments/runTransform'

function updateRedwoodToml(redwoodTomlPath: string) {
  const originalTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
  const redwoodTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
  // Can't type toml.parse because this PR has not been included in a released yet
  // https://github.com/iarna/iarna-toml/commit/5a89e6e65281e4544e23d3dbaf9e8428ed8140e9
  const redwoodTomlObject = toml.parse(redwoodTomlContent) as any
  const hasExistingGraphqlSection = !!redwoodTomlObject?.graphql

  if (redwoodTomlObject?.graphql?.trustedDocuments) {
    console.info(
      'GraphQL Trusted Documents are already enabled in your Redwood project.'
    )

    return { newConfig: undefined, trustedDocumentsExists: true }
  }

  let newTomlContent =
    originalTomlContent.replace(/\n$/, '') +
    '\n\n[graphql]\n  trustedDocuments = true'

  if (hasExistingGraphqlSection) {
    const existingGraphqlSetting = Object.keys(redwoodTomlObject.graphql)

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
      `${indentation}trustedDocuments = true`
    )

    newTomlContent = tomlLines.join('\n')
  }

  return { newConfig: newTomlContent, trustedDocumentsExists: false }
}

export async function handler({ force }: { force: boolean }) {
  const tasks = new Listr(
    [
      {
        title:
          'Update Redwood Project Configuration to enable GraphQL Trusted Documents ...',
        task: () => {
          const redwoodTomlPath = getConfigPath()

          const { newConfig, trustedDocumentsExists } =
            updateRedwoodToml(redwoodTomlPath)

          if (newConfig && (force || !trustedDocumentsExists)) {
            fs.writeFileSync(redwoodTomlPath, newConfig, 'utf-8')
          }
        },
      },
      {
        title: 'Generating Trusted Documents store ...',
        task: () => {
          execa.commandSync('yarn redwood generate types', { stdio: 'ignore' })
        },
      },
      {
        title:
          'Configuring the GraphQL Handler to use a Trusted Documents store ...',
        task: async () => {
          const transformResult = await runTransform({
            transformPath: path.join(__dirname, 'graphqlTransform.js'),
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
    console.error(e.message)
    process.exit(e?.exitCode || 1)
  }
}
