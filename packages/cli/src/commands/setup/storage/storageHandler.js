import crypto from 'node:crypto'
import path from 'node:path'

import fs from 'fs-extra'
import { Listr } from 'listr2'
import { format } from 'prettier'

import {
  addApiPackages,
  getPrettierOptions,
  addEnvVarTask,
} from '@redwoodjs/cli-helpers'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

export const handler = async ({ force, skipExamples }) => {
  const projectIsTypescript = isTypeScriptProject()
  const redwoodVersion =
    require(path.join(getPaths().base, 'package.json')).devDependencies[
      '@redwoodjs/core'
    ] ?? 'latest'

  const tasks = new Listr(
    [
      {
        title: `Adding api/src/lib/storage.${
          projectIsTypescript ? 'ts' : 'js'
        }...`,
        task: async () => {
          const templatePath = path.resolve(
            __dirname,
            'templates',
            'storage.ts.template',
          )
          const templateContent = fs.readFileSync(templatePath, {
            encoding: 'utf8',
            flag: 'r',
          })

          const storagePath = path.join(
            getPaths().api.lib,
            `storage.${projectIsTypescript ? 'ts' : 'js'}`,
          )
          const storageContent = projectIsTypescript
            ? templateContent
            : await transformTSToJS(storagePath, templateContent)

          return writeFile(storagePath, storageContent, {
            overwriteExisting: force,
          })
        },
      },
      {
        title: `Adding signedUrl function...`,
        skip: () => skipExamples,
        task: async () => {
          const templatePath = path.resolve(
            __dirname,
            'templates',
            'storageFunction.ts.template',
          )
          const templateContent = fs.readFileSync(templatePath, {
            encoding: 'utf8',
            flag: 'r',
          })

          const storagePath = path.join(
            getPaths().api.functions,
            `storage.${projectIsTypescript ? 'ts' : 'js'}`,
          )
          const storageContent = projectIsTypescript
            ? templateContent
            : await transformTSToJS(storagePath, templateContent)

          return writeFile(storagePath, storageContent, {
            overwriteExisting: force,
          })
        },
      },
      // TODO(jgmw): Enable this once these packages have been published otherwise it will fail
      {
        ...addApiPackages([
          `@redwoodjs/storage-core@${redwoodVersion}`,
          `@redwoodjs/storage-adapter-filesystem@${redwoodVersion}`,
        ]),
        title: 'Adding required dependencies to your api side...',
      },
      {
        title: 'Prettifying changed files',
        task: async (_ctx, task) => {
          const prettifyPaths = [
            path.join(getPaths().api.lib, 'storage.js'),
            path.join(getPaths().api.lib, 'storage.ts'),
            path.join(getPaths().api.functions, 'storage.js'),
            path.join(getPaths().api.functions, 'storage.ts'),
          ]

          for (const prettifyPath of prettifyPaths) {
            try {
              if (!fs.existsSync(prettifyPath)) {
                continue
              }
              const source = fs.readFileSync(prettifyPath, 'utf-8')
              const prettierOptions = await getPrettierOptions()
              const prettifiedApp = await format(source, {
                ...prettierOptions,
                parser: 'babel-ts',
              })

              fs.writeFileSync(prettifyPath, prettifiedApp, 'utf-8')
            } catch {
              task.output =
                "Couldn't prettify the changes. Please reformat the files manually if needed."
            }
          }
        },
      },
      addEnvVarTask(
        'STORAGE_SIGNING_SECRET',
        crypto.randomBytes(32).toString('base64'),
        'Secret for securely signing tokens used in the self hosted storage function',
      ),
      addEnvVarTask(
        'STORAGE_SIGNING_BASE_URL',
        'http://localhost:8911/storage',
        'Base URL for the self hosted storage function',
      ),
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...

          ${c.success('\nStorage setup complete!\n')}

          Check out the docs for more info:
          ${c.link('https://docs.redwoodjs.com/docs/storage')}

        `
        },
      },
    ],
    {
      rendererOptions: { collapseSubtasks: false },
    },
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
