import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import terminalLink from 'terminal-link'

import c from 'src/lib/colors'
import generateCurrentUserTypes from 'src/lib/runPreBuildTasks'

import { generateGqlTypes } from './generate-gql-types'

export const command = 'types [side]'
export const description = 'Generate a data migration'

/** @type {(yargs: import('yargs')) => import('yargs')} */
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#generate-types'
    )}`
  )
}

export const handler = async (args) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating CurrentUser types...',
        task: () => {
          return generateCurrentUserTypes()
        },
      },
      {
        title: 'Generating graphql types...',
        task: () => {
          return generateGqlTypes()
        },
      },
    ].filter(Boolean),
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
