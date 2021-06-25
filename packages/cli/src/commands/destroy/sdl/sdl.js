import Listr from 'listr'

import { ensureUniquePlural } from 'src/commands/generate/helpers'
import { deleteFilesTask } from 'src/lib'
import c from 'src/lib/colors'

import { files } from '../../generate/sdl/sdl'

export const command = 'sdl <model>'
export const description =
  'Destroy a GraphQL schema and service component based on a given DB schema Model'

export const builder = (yargs) => {
  yargs.positional('model', {
    description: 'Model to destroy the sdl of',
    type: 'string',
  })
}

export const tasks = ({ model }) =>
  new Listr(
    [
      {
        title: 'Destroying GraphQL schema and service component files...',
        task: async () => {
          const f = await files({ name: model })
          return deleteFilesTask(f)
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )

export const handler = async ({ model }) => {
  await ensureUniquePlural({ model, inDestroyer: true })
  const t = tasks({ model })

  try {
    await t.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
