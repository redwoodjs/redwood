import path from 'path'

import fs from 'fs-extra'
import { Listr } from 'listr2'

import { addApiPackages } from '@redwoodjs/cli-helpers'
import { getConfigPath } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../lib'
import c from '../../lib/colors'
import { isTypeScriptProject } from '../../lib/project'

import { command, description, EXPERIMENTAL_TOPIC_ID } from './setupServerFile'
import { printTaskEpilogue } from './util'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf-8')
)

export const setupServerFileTasks = (force = false) => {
  const redwoodPaths = getPaths()
  const ts = isTypeScriptProject()

  const serverFilePath = path.join(
    redwoodPaths.api.src,
    `server.${isTypeScriptProject() ? 'ts' : 'js'}`
  )

  return [
    {
      title: 'Adding the experimental server files...',
      task: () => {
        const serverFileTemplateContent = fs.readFileSync(
          path.resolve(__dirname, 'templates', 'server.ts.template'),
          'utf-8'
        )

        const setupScriptContent = ts
          ? serverFileTemplateContent
          : transformTSToJS(serverFilePath, serverFileTemplateContent)

        return [
          writeFile(serverFilePath, setupScriptContent, {
            overwriteExisting: force,
          }),
        ]
      },
    },
    {
      title: 'Adding config to redwood.toml...',
      task: (_ctx, task) => {
        //
        const redwoodTomlPath = getConfigPath()
        const configContent = fs.readFileSync(redwoodTomlPath, 'utf-8')
        if (!configContent.includes('[experimental.serverFile]')) {
          // Use string replace to preserve comments and formatting
          writeFile(
            redwoodTomlPath,
            configContent.concat(
              `\n[experimental.serverFile]\n\tenabled = true\n`
            ),
            {
              overwriteExisting: true, // redwood.toml always exists
            }
          )
        } else {
          task.skip(
            `The [experimental.serverFile] config block already exists in your 'redwood.toml' file.`
          )
        }
      },
    },
    addApiPackages([
      'fastify',
      'chalk@4.1.2',
      `@redwoodjs/fastify@${version}`,
      `@redwoodjs/project-config@${version}`,
    ]),
  ]
}

export async function handler({ force, verbose }) {
  const tasks = new Listr(
    [
      {
        title: 'Confirmation',
        task: async (_ctx, task) => {
          const confirmation = await task.prompt({
            type: 'Confirm',
            message: 'The server file is experimental. Continue?',
          })

          if (!confirmation) {
            throw new Error('User aborted')
          }
        },
      },
      ...setupServerFileTasks(force),
      {
        task: () => {
          printTaskEpilogue(command, description, EXPERIMENTAL_TOPIC_ID)
        },
      },
    ],
    {
      rendererOptions: { collapseSubtasks: false, persistentOutput: true },
      renderer: verbose ? 'verbose' : 'default',
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
