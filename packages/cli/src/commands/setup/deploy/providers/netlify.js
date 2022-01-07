// import terminalLink from 'terminal-link'
import path from 'path'

import Listr from 'listr'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'
import {
  createAddFilesTask,
  printSetupNotes,
  updateApiURLTask,
} from '../helpers'
import { NETLIFY_TOML } from '../templates/netlify'

export const command = 'netlify'
export const description = 'Setup Netlify deploy'

const files = [
  { path: path.join(getPaths().base, 'netlify.toml'), content: NETLIFY_TOML },
]

const notes = [
  'You are ready to deploy to Netlify!',
  'See: https://redwoodjs.com/docs/deploy#netlify-deploy',
]

export const handler = async ({ force }) => {
  const tasks = new Listr([
    updateApiURLTask('./netlify/function'),
    createAddFilesTask({
      files,
      force,
    }),
    printSetupNotes(notes),
  ])
  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
