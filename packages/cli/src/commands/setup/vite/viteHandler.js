import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import { Listr } from 'listr2'

import { addWebPackages } from '@redwoodjs/cli-helpers'
import { getConfigPath } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../../package.json'), 'utf-8')
)

export const handler = async ({ force, verbose, addPackage }) => {
  const ts = isTypeScriptProject()
  const tasks = new Listr(
    [
      {
        title: 'Adding vite.config.js...',
        task: () => {
          const viteConfigPath = getPaths().web.viteConfig

          const templateContent = fs.readFileSync(
            path.resolve(__dirname, 'templates', 'vite.config.ts.template'),
            'utf-8'
          )

          const viteConfigContent = ts
            ? templateContent
            : transformTSToJS(viteConfigPath, templateContent)

          return writeFile(viteConfigPath, viteConfigContent, {
            overwriteExisting: force,
          })
        },
      },
      {
        title: "Checking bundler isn't set to webpack...",
        task: (_ctx, task) => {
          const redwoodTomlPath = getConfigPath()
          const configContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

          if (configContent.includes('bundler = "webpack"')) {
            throw new Error(
              'You have the bundler set to webpack in your redwood.toml. Remove this line, or change it to "vite" and try again.'
            )
          } else {
            task.skip('Vite bundler flag already set in redwood.toml')
          }
        },
      },
      {
        title: 'Creating new entry point in `web/src/entry.client.jsx`...',
        task: () => {
          const entryPointFile = getPaths().web.entryClient

          const content = fs
            .readFileSync(
              path.join(
                getPaths().base,
                // NOTE we're copying over the index.js before babel transform
                'node_modules/@redwoodjs/web/src/entry/index.js'
              ),
              'utf-8'
            )
            .replace('~redwood-app-root', './App')

          return writeFile(entryPointFile, content, {
            overwriteExisting: force,
          })
        },
      },
      {
        ...addWebPackages([`@redwoodjs/vite@${version}`]),
        title: 'Adding @redwoodjs/vite dependency...',
        skip: () => {
          if (!addPackage) {
            return 'Skipping package install, you will need to add @redwoodjs/vite manaually as a dev-dependency on the web workspace'
          }
        },
      },
    ],
    {
      rendererOptions: { collapseSubtasks: false },
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
