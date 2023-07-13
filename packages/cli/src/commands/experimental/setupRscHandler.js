import fs from 'fs'
import path from 'path'

import { Listr } from 'listr2'

import { getConfig, getConfigPath } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFile } from '../../lib'
import c from '../../lib/colors'
import { isTypeScriptProject } from '../../lib/project'

import {
  command,
  description,
  EXPERIMENTAL_TOPIC_ID,
} from './setupStreamingSsr'
import { printTaskEpilogue } from './util'

export const handler = async ({ force, verbose }) => {
  const rwPaths = getPaths()
  const redwoodTomlPath = getConfigPath()
  const configContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

  const tasks = new Listr(
    [
      {
        title: 'Check prerequisites',
        task: () => {
          if (!rwPaths.web.entryClient || !rwPaths.web.viteConfig) {
            throw new Error('Vite needs to be setup before you can enable RSCs')
          }

          if (!getConfig().experimental?.streamingSsr?.enabled) {
            throw new Error(
              'The Streaming SSR experimental feature must be enabled before you can enable RSCs'
            )
          }

          if (!isTypeScriptProject()) {
            throw new Error(
              'RSCs are only supported in TypeScript projects at this time'
            )
          }
        },
      },
      {
        title: 'Adding config to redwood.toml...',
        task: (_ctx, task) => {
          if (!configContent.includes('[experimental.rsc]')) {
            writeFile(
              redwoodTomlPath,
              configContent.concat('\n[experimental.rsc]\n  enabled = true\n'),
              {
                overwriteExisting: true, // redwood.toml always exists
              }
            )
          } else {
            if (force) {
              task.output = 'Overwriting config in redwood.toml'

              writeFile(
                redwoodTomlPath,
                configContent.replace(
                  // Enable if it's currently disabled
                  '\n[experimental.rsc]\n  enabled = false\n',
                  '\n[experimental.rsc]\n  enabled = true\n'
                ),
                {
                  overwriteExisting: true, // redwood.toml always exists
                }
              )
            } else {
              task.skip(
                'The [experimental.rsc] config block already exists in your `redwood.toml` file.'
              )
            }
          }
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Adding entries.ts...',
        task: async () => {
          const entriesTemplate = fs.readFileSync(
            path.resolve(__dirname, 'templates', 'rsc', 'entries.ts.template'),
            'utf-8'
          )

          // Can't use rwPaths.web.entries because it's not created yet
          writeFile(path.join(rwPaths.web.src, 'entries.ts'), entriesTemplate, {
            overwriteExisting: force,
          })
        },
      },
      {
        title: 'Overwriting App.tsx...',
        task: async () => {
          const appTemplate = fs.readFileSync(
            path.resolve(__dirname, 'templates', 'rsc', 'App.tsx.template'),
            'utf-8'
          )
          const appPath = rwPaths.web.app

          writeFile(appPath, appTemplate, {
            overwriteExisting: true,
          })
        },
      },
      {
        title: 'Adding Counter.tsx...',
        task: async () => {
          const counterTemplate = fs.readFileSync(
            path.resolve(__dirname, 'templates', 'rsc', 'Counter.tsx.template'),
            'utf-8'
          )
          const counterPath = path.join(rwPaths.web.src, 'Counter.tsx')

          writeFile(counterPath, counterTemplate, {
            overwriteExisting: force,
          })
        },
      },
      {
        title: 'Updating index.html...',
        task: async () => {
          let indexHtml = fs.readFileSync(rwPaths.web.html, 'utf-8')
          indexHtml = indexHtml.replace(
            'href="/favicon.png" />',
            'href="/favicon.png" />\n  <script type="module" src="entry.client.tsx"></script>'
          )

          writeFile(rwPaths.web.html, indexHtml, {
            overwriteExisting: true,
          })
        },
      },
      {
        title: 'Overwrite entry.client.tsx...',
        task: async () => {
          const entryClientTemplate = fs.readFileSync(
            path.resolve(
              __dirname,
              'templates',
              'rsc',
              'entry.client.tsx.template'
            ),
            'utf-8'
          )

          writeFile(rwPaths.web.entryClient, entryClientTemplate, {
            overwriteExisting: true,
          })
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
