import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import { Listr } from 'listr2'
import type { Argv } from 'yargs'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../../../../lib/colors'

interface RedwoodUIYargsOptions {
  force: boolean
  install: boolean
}

export const command = 'redwoodui'
export const aliases = ['rwui']
export const description = 'Set up RedwoodUI'
export function builder(
  yargs: Argv<RedwoodUIYargsOptions>,
): Argv<RedwoodUIYargsOptions> {
  return yargs
    .option('force', {
      alias: 'f',
      default: false,
      description:
        'Overwrite all existing configuration (NOTE: this will also reset your TailwindCSS configuration!)',
      type: 'boolean',
    })
    .option('install', {
      alias: 'i',
      default: true,
      description: 'Install packages',
      type: 'boolean',
    })
}

export const handler = async ({ force, install }: RedwoodUIYargsOptions) => {
  recordTelemetryAttributes({
    command: 'setup ui redwoodui',
    force,
    install,
  })
  const rwPaths = getPaths()

  const tasks = new Listr([
    {
      title: 'Setting up TailwindCSS...',
      // first, check that Tailwind has been setup.
      // there's already a setup command for this,
      // so if it's not setup, we can just run that command.
      skip: async () => {
        // if force is true, never skip
        if (force) {
          return false
        }

        const tailwindConfigPath = path.join(
          rwPaths.web.config,
          'tailwind.config.js',
        )
        const indexCSSPath = path.join(rwPaths.web.src, 'index.css')

        // if the config already exists, don't need to set up, so skip
        if (fs.existsSync(tailwindConfigPath) && fs.existsSync(indexCSSPath)) {
          return 'TailwindCSS is already set up.'
        } else {
          return false
        }
      },
      task: async () => {
        const argsToInclude: string[] = [force && '-f', install && '-i'].filter(
          (item) => item != false,
        )
        await execa(
          'yarn',
          ['rw', 'setup', 'ui', 'tailwindcss', ...argsToInclude],
          // this is needed so that the output is shown in the terminal.
          // TODO: still, it's not perfect, because the output is shown below the others
          // and seems to be swallowing, for example, part of the suggested extensions message.
          { stdio: 'inherit' },
        )
      },
    },
    {
      title: "Adding RedwoodUI's TailwindCSS configuration...",
      task: async () => {
        console.log('todo...')
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e: any) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
