import path from 'path'

import { Listr } from 'listr2'
import prompts from 'prompts'

import { generate as generateTypes } from '@redwoodjs/internal/dist/generate/generate'
import { errorTelemetry } from '@redwoodjs/telemetry'

import {
  generateTemplate,
  getPaths,
  transformTSToJS,
  writeFile,
} from '../../lib'
import c from '../../lib/colors'
import { isTypeScriptProject } from '../../lib/project'

import { command, description, EXPERIMENTAL_TOPIC_ID } from './setupRealtime'
import { printTaskEpilogue, isServerFileSetup, isRealtimeSetup } from './util'

export async function handler({ name, type, force, verbose }) {
  const redwoodPaths = getPaths()
  const ts = isTypeScriptProject()

  let functionType = type

  // Prompt to select what type if not specified
  if (!functionType) {
    const response = await prompts({
      type: 'select',
      name: 'functionType',
      choices: [
        {
          value: 'liveQuery',
          title: 'Live Query',
          description: 'Create a Live Query to watch for changes in data',
        },
        {
          value: 'subscription',
          title: 'Subscription',
          description: 'Create a Subscription to watch for events',
        },
      ],
      message: 'What type of realtime event would you like to create?',
    })

    functionType = response.functionType
  }

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
          isServerFileSetup() && isRealtimeSetup()
        },
      },
      {
        title: `Adding ${name} example subscription ...`,
        skip: () => functionType !== 'subscription',
        task: () => {
          // sdl

          const exampleSdlTemplateContent = path.resolve(
            __dirname,
            'templates',
            'subscriptions',
            'blank',
            `blank.sdl.ts.template`
          )

          const sdlFile = path.join(
            redwoodPaths.api.graphql,
            `${name}.sdl.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const sdlContent = ts
            ? exampleSdlTemplateContent
            : transformTSToJS(sdlFile, exampleSdlTemplateContent)

          // service

          const exampleServiceTemplateContent = path.resolve(
            __dirname,
            'templates',
            'subscriptions',
            'blank',
            `blank.service.ts.template`
          )
          const serviceFile = path.join(
            redwoodPaths.api.services,
            `${name}`,
            `${name}.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const serviceContent = ts
            ? exampleServiceTemplateContent
            : transformTSToJS(serviceFile, exampleServiceTemplateContent)

          // subscription

          const exampleSubscriptionTemplateContent = path.resolve(
            __dirname,
            'templates',
            'subscriptions',
            'blank',
            `blank.ts.template`
          )

          const exampleFile = path.join(
            redwoodPaths.api.subscriptions,
            `${name}`,
            `${name}.${isTypeScriptProject() ? 'ts' : 'js'}`
          )

          const setupScriptContent = ts
            ? exampleSubscriptionTemplateContent
            : transformTSToJS(exampleFile, exampleSubscriptionTemplateContent)

          // write all files
          return [
            writeFile(sdlFile, generateTemplate(sdlContent, { name }), {
              overwriteExisting: force,
            }),
            writeFile(serviceFile, generateTemplate(serviceContent, { name }), {
              overwriteExisting: force,
            }),
            writeFile(
              exampleFile,
              generateTemplate(setupScriptContent, { name }),
              {
                overwriteExisting: force,
              }
            ),
          ]
        },
      },
      {
        title: `Adding ${name} example live query ...`,
        skip: () => functionType !== 'liveQuery',
        task: () => {
          // sdl
          const exampleSdlTemplateContent = path.resolve(
            __dirname,
            'templates',
            'liveQueries',
            'blank',
            `blank.sdl.ts.template`
          )
          const sdlFile = path.join(
            redwoodPaths.api.graphql,
            `${name}.sdl.${isTypeScriptProject() ? 'ts' : 'js'}`
          )
          const sdlContent = ts
            ? exampleSdlTemplateContent
            : transformTSToJS(sdlFile, exampleSdlTemplateContent)

          // service
          const exampleServiceTemplateContent = path.resolve(
            __dirname,
            'templates',
            'liveQueries',
            'blank',
            'blank.service.ts.template'
          )

          const serviceFile = path.join(
            redwoodPaths.api.services,
            `${name}`,
            `${name}.${isTypeScriptProject() ? 'ts' : 'js'}`
          )
          const serviceContent = ts
            ? exampleServiceTemplateContent
            : transformTSToJS(serviceFile, exampleServiceTemplateContent)

          // write all files
          return [
            writeFile(sdlFile, generateTemplate(sdlContent, { name }), {
              overwriteExisting: force,
            }),
            writeFile(serviceFile, generateTemplate(serviceContent, { name }), {
              overwriteExisting: force,
            }),
          ]
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
