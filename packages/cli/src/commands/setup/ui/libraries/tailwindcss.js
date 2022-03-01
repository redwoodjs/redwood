import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { outputFileSync } from 'fs-extra'
import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'

export const command = 'tailwindcss'
export const aliases = ['tailwind', 'tw']
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
  // using outer double quotes and inner single quotes here to generate code
  // the way prettier wants it in the actual RW app where this will be used
  "@import 'tailwindcss/base';",
  "@import 'tailwindcss/components';",
  "@import 'tailwindcss/utilities';",
]

const tailwindImportsExist = (indexCSS) =>
  tailwindImports
    .map((el) => new RegExp(el))
    .every((tailwindDirective) => tailwindDirective.test(indexCSS))

const tailwindImportsAndNotes = [
  '/**',
  ' * START --- SETUP TAILWINDCSS EDIT',
  ' *',
  ' * `yarn rw setup ui tailwindcss` placed these imports here',
  " * to inject Tailwind's styles into your CSS.",
  ' * For more information, see: https://tailwindcss.com/docs/installation#include-tailwind-in-your-css',
  ' */',
  ...tailwindImports,
  '/**',
  ' * END --- SETUP TAILWINDCSS EDIT',
  ' */\n',
]

export const handler = async ({ force, install }) => {
  const rwPaths = getPaths()

  const packages = ['postcss', 'postcss-loader', 'tailwindcss', 'autoprefixer']

  const tasks = new Listr([
    {
      title: 'Installing packages...',
      skip: () => !install,
      task: () => {
        return new Listr([
          {
            title: `Install ${packages.join(', ')}`,
            task: async () => {
              await execa('yarn', [
                'workspace',
                'web',
                'add',
                '-D',
                ...packages,
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
         * Check if PostCSS config already exists.
         * If it exists, throw an error.
         */
        const postCSSConfigPath = rwPaths.web.postcss

        if (!force && fs.existsSync(postCSSConfigPath)) {
          throw new Error(
            'PostCSS config already exists.\nUse --force to override existing config.'
          )
        } else {
          const postCSSConfig = fs.readFileSync(
            path.join(__dirname, '../templates/postcss.config.js.template'),
            'utf-8'
          )

          return outputFileSync(postCSSConfigPath, postCSSConfig)
        }
      },
    },
    {
      title: 'Initializing Tailwind CSS...',
      task: async () => {
        const tailwindConfigPath = path.join(
          rwPaths.web.config,
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

        await execa('yarn', ['tailwindcss', 'init', tailwindConfigPath])

        // Replace `content`.
        const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf-8')
        const newTailwindConfig = tailwindConfig.replace(
          'content: []',
          "content: ['src/**/*.{js,jsx,ts,tsx}']"
        )
        fs.writeFileSync(tailwindConfigPath, newTailwindConfig)
      },
    },
    {
      title: 'Adding import to index.css...',
      task: (_ctx, task) => {
        const INDEX_CSS_PATH = path.join(rwPaths.web.src, 'index.css')
        const indexCSS = fs.readFileSync(INDEX_CSS_PATH, 'utf-8')

        if (tailwindImportsExist(indexCSS)) {
          task.skip('Imports already exist in index.css')
        } else {
          const newIndexCSS = tailwindImportsAndNotes.join('\n') + indexCSS
          fs.writeFileSync(INDEX_CSS_PATH, newIndexCSS)
        }
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
