import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import { Listr } from 'listr2'

import { addApiPackages } from '@redwoodjs/cli-helpers'
import { getConfigPath } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../../../lib'
import c from '../../../../lib/colors'
import { isTypeScriptProject } from '../../../../lib/project'

export async function handler({ force, verbose }) {
  const redwoodPaths = getPaths()
  const ts = isTypeScriptProject()

  const serverFilePath = path.join(
    redwoodPaths.api.src,
    `server.${isTypeScriptProject() ? 'ts' : 'js'}`
  )

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
      {
        title: 'Adding the experimental server file...',
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
        '@redwoodjs/fastify@canary',
        '@redwoodjs/project-config',
      ]),
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          console.log(
            `${chalk.hex('#ff845e')(
              `------------------------------------------------------------------\n 🧪 ${chalk.green(
                'Experimental Feature'
              )} 🧪\n------------------------------------------------------------------`
            )}`
          )
          console.log(
            `The server file is an experimental feature, please find documentation and links to provide feedback at:\n -> https://community.redwoodjs.com/t/fastify-server-file-experiment/4851`
          )
          console.log(
            `${chalk.hex('#ff845e')(
              '------------------------------------------------------------------'
            )}\n`
          )

          task.title = `One more thing...\n
          ${c.green('The server file is still experimental!')}
          ${c.green(
            'Please let us know if you find bugs or quirks or if you have any feedback!'
          )}
          ${chalk.hex('#e8e8e8')('todo')}
        `
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
