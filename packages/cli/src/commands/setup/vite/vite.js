import fs from 'fs'
import path from 'path'

import toml from '@iarna/toml'
import chalk from 'chalk'
import { Listr } from 'listr2'

import { addWebPackages } from '@redwoodjs/cli-helpers'
import { getConfigPath } from '@redwoodjs/internal/dist/paths'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

export const command = 'vite'
export const description =
  '[Experimental] Configure the web side to use Vite, instead of Webpack'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
  yargs.option('verbose', {
    alias: 'v',
    default: false,
    description: 'Print more logs',
    type: 'boolean',
  })
  yargs.option('add-package', {
    default: true,
    description:
      'Allows you to skip adding the @redwoodjs/vite package. Useful for testing',
    type: 'boolean',
  })
}

export const handler = async ({ force, verbose, addPackage }) => {
  const ts = isTypeScriptProject()
  const tasks = new Listr(
    [
      {
        title: 'Confirmation',
        task: async (_ctx, task) => {
          const confirmation = await task.prompt({
            type: 'Confirm',
            message: 'Vite support is experimental. Continue?',
          })

          if (!confirmation) {
            throw new Error('User aborted')
          }
        },
      },
      {
        title: 'Adding vite.config.js...',
        task: () => {
          const viteConfigPath = `${getPaths().web.base}/vite.config.${
            ts ? 'ts' : 'js'
          }`

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
        title: 'Updating DevFatalError Page import...',
        task: (_ctx, task) => {
          const fatalErrorPagePath = path.join(
            getPaths().web.pages,
            `FatalErrorPage/FatalErrorPage.${ts ? 'tsx' : 'js'}`
          )

          if (!fs.existsSync(fatalErrorPagePath)) {
            task.skip('No DevFatalError page found')
          }

          const content = fs.readFileSync(fatalErrorPagePath, 'utf-8')

          const updatedContent = content.replace(
            `require('@redwoodjs/web/dist/components/DevFatalErrorPage').DevFatalErrorPage`,
            `(await import(
            '@redwoodjs/web/dist/components/DevFatalErrorPage'
          )).DevFatalErrorPage`
          )

          return writeFile(fatalErrorPagePath, updatedContent, {
            overwriteExisting: true,
          })
        },
      },
      {
        title: 'Adding Vite bundler flag to redwood.toml...',
        task: (_ctx, task) => {
          const redwoodTomlPath = getConfigPath()
          const config = toml.parse(fs.readFileSync(redwoodTomlPath, 'utf-8'))

          if (config.web.bundler !== 'vite') {
            config.web.bundler = 'vite'

            writeFile(redwoodTomlPath, toml.stringify(config), {
              overwriteExisting: true, // redwood.toml always exists
            })
          } else {
            task.skip('Vite bundler flag already set in redwood.toml')
          }
        },
      },
      {
        title: 'Creating new entry point in `web/src/index.{jsx,tsx}`...',
        task: () => {
          // @NOTE: needs to be JSX/TSX!
          const entryPointFile = path.join(
            getPaths().web.src,
            `index.${ts ? 'tsx' : 'jsx'}`
          )
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
        title: 'Adding script tag to `web/src/index.html`...',
        task: (_ctx, task) => {
          const indexHtmlPath = path.join(getPaths().web.src, 'index.html')

          const content = fs.readFileSync(indexHtmlPath, 'utf-8')

          if (!content.includes('<script type="module" src="index.jsx">')) {
            const withScriptInsert = content.replace(
              '</head>',
              '<script type="module" src="index.jsx"></script>\n</head>'
            )

            return writeFile(indexHtmlPath, withScriptInsert, {
              overwriteExisting: true,
            })
          } else {
            task.skip('Already configured')
          }
        },
      },
      {
        title: 'Adding @redwoodjs/vite dependency...',
        task: () => {
          return addWebPackages('@redwoodjs/vite')
        },
        skip: () => !addPackage,
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...\n
          ${c.green('Vite Support is still experimental!')}
          ${c.green('Please let us know if you find bugs or quirks.')}
          ${chalk.hex('#e8e8e8')(
            'https://github.com/redwoodjs/redwood/issues/new'
          )}
        `
        },
      },
    ],
    {
      rendererOptions: { collapse: false },
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
