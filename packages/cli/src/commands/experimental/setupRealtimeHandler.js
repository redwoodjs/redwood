import fs from 'fs'
import path from 'path'

import { Listr } from 'listr2'

import { addApiPackages } from '@redwoodjs/cli-helpers'
import { generate as generateTypes } from '@redwoodjs/internal/dist/generate/generate'
import { getConfigPath } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../lib'
import c from '../../lib/colors'
import { isTypeScriptProject } from '../../lib/project'

import { command, description, EXPERIMENTAL_TOPIC_ID } from './setupRealtime'
import { printTaskEpilogue, isServerFileSetup } from './util'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf-8')
)

export async function handler({ force, includeExamples, verbose }) {
  const redwoodPaths = getPaths()
  const ts = isTypeScriptProject()

  const realtimeLibFilePath = path.join(
    redwoodPaths.api.lib,
    `realtime.${isTypeScriptProject() ? 'ts' : 'js'}`
  )

  const tasks = new Listr(
    [
      {
        title: 'Confirmation',
        task: async (_ctx, task) => {
          const confirmation = await task.prompt({
            type: 'Confirm',
            message:
              'Realtime is currently an experimental RedwoodJS feature. Continue?',
          })

          if (!confirmation) {
            throw new Error('User aborted')
          }
        },
      },
      {
        title: 'Checking for realtime environment prerequisites ...',
        task: () => {
          isServerFileSetup()
        },
      },
      addApiPackages(['ioredis@^5', `@redwoodjs/realtime@${version}`]),
      {
        title: 'Adding the realtime api lib ...',
        task: () => {
          const serverFileTemplateContent = fs.readFileSync(
            path.resolve(__dirname, 'templates', 'realtime.ts.template'),
            'utf-8'
          )

          const setupScriptContent = ts
            ? serverFileTemplateContent
            : transformTSToJS(realtimeLibFilePath, serverFileTemplateContent)

          return [
            writeFile(realtimeLibFilePath, setupScriptContent, {
              overwriteExisting: force,
            }),
          ]
        },
      },
      {
        title: 'Adding Countdown example subscription ...',
        enabled: () => includeExamples,
        task: () => {
          const exampleSubscriptionTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'subscriptions',
              'countdown',
              `countdown.ts.template`
            ),
            'utf-8'
          )

          const exampleFile = path.join(
            redwoodPaths.api.subscriptions,
            'countdown',
            `countdown.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const setupScriptContent = ts
            ? exampleSubscriptionTemplateContent
            : transformTSToJS(exampleFile, exampleSubscriptionTemplateContent)

          return [
            writeFile(exampleFile, setupScriptContent, {
              overwriteExisting: force,
            }),
          ]
        },
      },
      {
        title: 'Adding NewMessage example subscription ...',
        enabled: () => includeExamples,
        task: () => {
          // sdl

          const exampleSdlTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'subscriptions',
              'newMessage',
              `rooms.sdl.ts.template`
            ),
            'utf-8'
          )

          const sdlFile = path.join(
            redwoodPaths.api.graphql,
            `rooms.sdl.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const sdlContent = ts
            ? exampleSdlTemplateContent
            : transformTSToJS(sdlFile, exampleSdlTemplateContent)

          // service

          const exampleServiceTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'subscriptions',
              'newMessage',
              `rooms.ts.template`
            ),
            'utf-8'
          )
          const serviceFile = path.join(
            redwoodPaths.api.services,
            'rooms',
            `rooms.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const serviceContent = ts
            ? exampleServiceTemplateContent
            : transformTSToJS(serviceFile, exampleServiceTemplateContent)

          // subscription

          const exampleSubscriptionTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'subscriptions',
              'newMessage',
              `newMessage.ts.template`
            ),
            'utf-8'
          )

          const exampleFile = path.join(
            redwoodPaths.api.subscriptions,
            'newMessage',
            `newMessage.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const setupScriptContent = ts
            ? exampleSubscriptionTemplateContent
            : transformTSToJS(exampleFile, exampleSubscriptionTemplateContent)

          // write all files
          return [
            writeFile(sdlFile, sdlContent, {
              overwriteExisting: force,
            }),
            writeFile(serviceFile, serviceContent, {
              overwriteExisting: force,
            }),
            writeFile(exampleFile, setupScriptContent, {
              overwriteExisting: force,
            }),
          ]
        },
      },
      {
        title: 'Adding Auctions example live query ...',
        enabled: () => includeExamples,
        task: () => {
          // sdl

          const exampleSdlTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'liveQueries',
              'auctions',
              `auctions.sdl.ts.template`
            ),
            'utf-8'
          )

          const sdlFile = path.join(
            redwoodPaths.api.graphql,
            `auctions.sdl.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const sdlContent = ts
            ? exampleSdlTemplateContent
            : transformTSToJS(sdlFile, exampleSdlTemplateContent)

          // service

          const exampleServiceTemplateContent = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'liveQueries',
              'auctions',
              `auctions.ts.template`
            ),
            'utf-8'
          )
          const serviceFile = path.join(
            redwoodPaths.api.services,
            'auctions',
            `auctions.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const serviceContent = ts
            ? exampleServiceTemplateContent
            : transformTSToJS(serviceFile, exampleServiceTemplateContent)

          // write all files
          return [
            writeFile(sdlFile, sdlContent, {
              overwriteExisting: force,
            }),
            writeFile(serviceFile, serviceContent, {
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
          if (!configContent.includes('[experimental.realtime]')) {
            // Use string replace to preserve comments and formatting
            writeFile(
              redwoodTomlPath,
              configContent.concat(
                `\n[experimental.realtime]\n\tenabled = true\n`
              ),
              {
                overwriteExisting: true, // redwood.toml always exists
              }
            )
          } else {
            task.skip(
              `The [experimental.realtime] config block already exists in your 'redwood.toml' file.`
            )
          }
        },
      },
      {
        title: `Generating types ...`,
        task: async () => {
          await generateTypes()
          console.log(
            'Note: You may need to manually restart GraphQL in VSCode to see the new types take effect.\n\n'
          )
        },
      },
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
