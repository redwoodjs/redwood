import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import execa from 'execa'
import chalk from 'chalk'

import c from 'src/lib/colors'
import { getPaths, writeFile } from 'src/lib'

export const command = 'tailwind'
export const description = 'Setup tailwindcss'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

const tailwindImportsAndNotes = [
  '/**',
  ' * START --- TAILWIND GENERATOR EDIT',
  ' *',
  ' * `yarn rw generate util tailwind` placed these imports here',
  " * to inject Tailwind's styles into your CSS.",
  ' * For more information, see: https://tailwindcss.com/docs/installation#add-tailwind-to-your-css',
  ' */',
  '@import "tailwindcss/base";',
  '@import "tailwindcss/components";',
  '@import "tailwindcss/utilities";',
  '/**',
  ' * END --- TAILWIND GENERATOR EDIT',
  ' */\n',
]

const INDEX_CSS_PATH = path.join(getPaths().web.src, 'index.css')

export const handler = async ({ force }) => {
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      task: async () => {
        /**
         * Install postcss-loader, tailwindcss, and autoprefixer
         */
        await execa('yarn', [
          'workspace',
          'web',
          'add',
          '-D',
          'postcss-loader@4.0.2',
          'tailwindcss',
          'autoprefixer@9.8.6',
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
        return writeFile(
          getPaths().web.postcss,
          fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'postcss.config.js.template')
            )
            .toString(),
          { overwriteExisting: force }
        )
      },
    },
    {
      title: 'Initializing Tailwind CSS...',
      task: async () => {
        /**
         * If it doesn't already exist,
         * initialize tailwind and move tailwind.config.js to web/
         */
        const configExists = fs.existsSync(
          path.join(getPaths().web.base, 'tailwind.config.js')
        )

        if (!configExists || force) {
          await execa('yarn', ['tailwindcss', 'init'])
          /**
           * Later, when we can tell the vscode extension where to look for the config,
           * we can put it in web/config/
           */
          await execa('mv', ['tailwind.config.js', 'web/'])
        }
      },
    },
    {
      title: 'Adding imports to index.css...',
      task: () => {
        /**
         * Add tailwind imports and notes to the top of index.css
         */
        let indexCSS = fs.readFileSync(INDEX_CSS_PATH)
        indexCSS = tailwindImportsAndNotes.join('\n') + indexCSS
        fs.writeFileSync(INDEX_CSS_PATH, indexCSS)
      },
    },
    {
      title: 'One more thing...',
      task: (_ctx, task) => {
        task.title = `One more thing...\n\n   ${chalk.hex('#bf4722')(
          'Quick link to the docs: '
        )}https://tailwindcss.com/\n`
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
