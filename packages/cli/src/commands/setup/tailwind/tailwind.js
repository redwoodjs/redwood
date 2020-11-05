import Listr from 'listr'
import chalk from 'chalk'

import c from 'src/lib/colors'
import {
  configurePostCSS,
  installPackages,
  yarnCheckFiles,
  initTailwind,
  addCSSImports,
} from './tasks'

export const command = 'tailwind'
export const description = 'Setup tailwindcss and PostCSS'
export const builder = (yargs) => {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .option('ui', {
      default: false,
      description: 'Install TailwindUI as well',
      type: 'boolean',
    })
}

const tasks = (args) =>
  new Listr([
    {
      title: 'Installing packages...',
      task: () => {
        return new Listr([
          {
            title: 'Install postcss-loader, tailwindcss, and autoprefixer',
            task: installPackages(args),
          },
          {
            title: 'Sync yarn.lock and node_modules',
            task: yarnCheckFiles(args),
          },
        ])
      },
    },
    {
      title: 'Configuring PostCSS...',
      task: configurePostCSS(args),
    },
    {
      title: 'Initializing Tailwind CSS...',
      task: initTailwind(args),
    },
    {
      title: 'Adding imports to index.css...',
      task: addCSSImports(args),
    },
    {
      title: 'One more thing...',
      task: (_ctx, task) => {
        task.title = `One more thing...\n
          ${c.green(
            'Tailwind configured with "upcoming change" opt-in enabled'
          )}\n
          ${chalk.hex('#e8e8e8')(
            'See this doc for info: https://tailwindcss.com/docs/upcoming-changes'
          )}
        `
      },
    },
  ])

export const handler = async (args) => {
  try {
    await tasks(args).run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
