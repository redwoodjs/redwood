import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import execa from 'execa'

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

const notes = [
  'Add the following directives to your ./web/src/index.css:',
  '',
  '@tailwind base;',
  '@tailwind components;',
  '@tailwind utilities;',
  '',
  "And don't forget to read the docs: https://tailwindcss.com/",
]

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
          'postcss-loader',
          'tailwindcss',
          'autoprefixer',
        ])
      },
    },
    {
      title: 'Configuring Postcss...',
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
      title: 'Initializing Tailwind...',
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
      title: 'One more thing...',
      task: (_ctx, task) => {
        /**
         * Instruct users to copy-paste the tailwind directives into web/src/index.css
         */
        task.title = `One more thing...\n\n   ${notes.join('\n   ')}\n`
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
