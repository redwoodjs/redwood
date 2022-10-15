// import terminalLink from 'terminal-link'
import path from 'path'

import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'
import { addFilesTask, addPackagesTask, printSetupNotes } from '../helpers'
import { DEPLOY, ECOSYSTEM, MAINTENANCE } from '../templates/baremetal'

export const command = 'baremetal'
export const description = 'Setup Baremetal deploy'
export const configFilename = 'deploy.toml'

const files = [
  {
    path: path.join(getPaths().base, configFilename),
    content: DEPLOY,
  },
  {
    path: path.join(getPaths().base, 'ecosystem.config.js'),
    content: ECOSYSTEM,
  },
  {
    path: path.join(getPaths().web.src, 'maintenance.html'),
    content: MAINTENANCE,
  },
]

const notes = [
  'You are almost ready to go BAREMETAL!',
  '',
  'See https://redwoodjs.com/docs/deploy/baremetal for the remaining',
  'config and setup required before you can perform your first deploy.',
]

export const handler = async ({ force }) => {
  const tasks = new Listr(
    [
      addPackagesTask({
        packages: ['node-ssh'],
        devDependency: true,
      }),
      addFilesTask({
        files,
        force,
      }),
      printSetupNotes(notes),
    ],
    { rendererOptions: { collapse: false } }
  )
  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
