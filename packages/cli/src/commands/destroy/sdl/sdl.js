import Listr from 'listr'

import { deleteFilesTask } from 'src/lib'
import c from 'src/lib/colors'

import { files } from '../../generate/sdl/sdl'

export const command = 'sdl <model>'
export const desc = 'Destroy a GraphQL schema and service object.'

export const handler = async ({ model }) => {
  const tasks = new Listr(
    [
      {
        title: 'Destroying GraphQL schema and service object files...',
        task: async () => {
          const f = await files({ name: model, crud: false })
          return deleteFilesTask(f)
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
