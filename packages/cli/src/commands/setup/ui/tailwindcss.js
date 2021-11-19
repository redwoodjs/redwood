import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import execa from 'execa'
import Listr from 'listr'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'

export const command = 'tailwindcss'
export const alias = ['tailwind', 'tw']
export const description = 'Set up tailwindcss and PostCSS'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })

  yargs.option('install', {
    alias: 'i',
    default: true,
    description: 'Install packages',
    type: 'boolean',
  })
}

const tailwindImports = [
  '@import "tailwindcss/base";',
  '@import "tailwindcss/components";',
  '@import "tailwindcss/utilities";',
]

const tailwindImportsExist = (indexCSS) =>
  tailwindImports
    .map((el) => new RegExp(el))
    .every((tailwindDirective) => tailwindDirective.test(indexCSS))

const tailwindImportsAndNotes = [
  '/**',
  ' * START --- TAILWIND GENERATOR EDIT',
  ' *',
  ' * `yarn rw setup tailwind` placed these imports here',
  " * to inject Tailwind's styles into your CSS.",
  ' * For more information, see: https://tailwindcss.com/docs/installation#add-tailwind-to-your-css',
  ' */',
  ...tailwindImports,
  '/**',
  ' * END --- TAILWIND GENERATOR EDIT',
  ' */\n',
]

export const handler = async ({ force, install }) => {
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      skip: () => !install,
      task: () => {
        return new Listr([
          {
            title:
              'Install postcss, postcss-loader, tailwindcss, and autoprefixer',
            task: async () => {
              await execa('yarn', [
                'workspace',
                'web',
                'add',
                '-D',
                'postcss',
                'postcss-loader',
                'tailwindcss',
                'autoprefixer',
              ])
            },
          },
        ])
      },
    },
    {
      title: 'Configuring PostCSS...',
      task: () => {
        /**
         * Make web/config if it doesn't exist
         * and write postcss.config.js there
         */

        /**
         * Check if PostCSS config already exists.
         * If it exists, throw an error.
         */
        const postCSSConfigPath = getPaths().web.postcss

        if (!force && fs.existsSync(postCSSConfigPath)) {
          throw new Error(
            'PostCSS config already exists.\nUse --force to override existing config.'
          )
        } else {
          return writeFile(
            postCSSConfigPath,
            fs
              .readFileSync(
                path.resolve(
                  __dirname,
                  'templates',
                  'postcss.config.js.template'
                )
              )
              .toString(),
            { overwriteExisting: force }
          )
        }
      },
    },
    {
      title: 'Initializing Tailwind CSS...',
      task: async () => {
        const webConfigPath = getPaths().web.config
        const tailwindConfigPath = path.join(
          webConfigPath,
          'tailwind.config.js'
        )

        if (fs.existsSync(tailwindConfigPath)) {
          if (force) {
            // `yarn tailwindcss init` will fail these files already exists
            fs.unlinkSync(tailwindConfigPath)
          } else {
            throw new Error(
              'Tailwindcss config already exists.\nUse --force to override existing config.'
            )
          }
        }

        await execa('yarn', [
          'tailwindcss',
          'init',
          tailwindConfigPath,
          '--jit',
        ])

        // add purge and lint
        const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf-8')
        const newTailwindConfig = tailwindConfig.replace(
          'purge: []',
          "purge: ['src/**/*.{js,jsx,ts,tsx}']"
        )

        fs.writeFileSync(tailwindConfigPath, newTailwindConfig)

        await execa('yarn', ['eslint', '--fix', tailwindConfigPath])
      },
    },
    {
      title: 'Adding import to index.css...',
      task: (_ctx, task) => {
        const INDEX_CSS_PATH = path.join(getPaths().web.src, 'index.css')
        const indexCSS = fs.readFileSync(INDEX_CSS_PATH, 'utf-8')

        if (tailwindImportsExist(indexCSS)) {
          task.skip('Imports already exist in index.css')
        } else {
          const newIndexCSS = tailwindImportsAndNotes.join('\n') + indexCSS
          fs.writeFileSync(INDEX_CSS_PATH, newIndexCSS)
        }
      },
    },
    {
      title: 'One more thing...',
      task: (_ctx, task) => {
        task.title = `One more thing...\n
          ${c.green('Tailwind configured with "Just-in-Time" mode')}\n
          ${chalk.hex('#e8e8e8')(
            'See this doc for info: https://tailwindcss.com/docs/just-in-time-mode'
          )}
        `
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
