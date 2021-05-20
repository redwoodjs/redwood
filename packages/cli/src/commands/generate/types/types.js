import chokidar from 'chokidar'
import Listr from 'listr'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

import { generateCurrentUserTypes } from './generate-current-user'
import { generateGqlTypes } from './generate-gql-types'

export const command = 'types [side]'
export const description = 'Generate graphql types'

/** @type {(yargs: import('yargs')) => import('yargs')} */
export const builder = (yargs) => {
  yargs.option('watch', {
    type: 'boolean',
    default: false,
  })
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#generate-types'
    )}`
  )
}

let watchHandle

export const handler = async ({ watch }) => {
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

    if (watch) {
      watchHandle = chokidar
        .watch(
          [
            `${getPaths().api.src}/**/*.{ts,tsx}`,
            `${getPaths().web.src}/**/*.{ts,tsx}`,
          ],
          {
            persistent: true,

            ignored: [
              '**/*.test.ts',
              '**/*.test.js',
              '**/__fixtures__/**',
              '**/__tests__/**',
              '**/dist/**',
            ],
          }
        )
        .on('change', () => {
          // For now we only need to dynamically generate gql types
          generateGqlTypes()
        })

      process.on('SIGINT', () => {
        watchHandle?.close()
      })
    }
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
