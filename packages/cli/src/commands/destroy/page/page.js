import camelcase from 'camelcase'
import Listr from 'listr'

import { deleteFilesTask, removeRoutesFromRouterTask } from 'src/lib'
import c from 'src/lib/colors'

import { pathName } from '../../generate/helpers'
import { files as pageFiles } from '../../generate/page/page'

export const command = 'page <name> [path]'
export const desc = 'Destroy a page component.'

export const tasks = ({ name, path }) =>
  new Listr(
    [
      {
        title: 'Destroying page files...',
        task: async () => {
          const f = pageFiles({ name, path: pathName(path, name) })
          return deleteFilesTask(f)
        },
      },
      {
        title: 'Cleaning up routes file...',
        task: async () => removeRoutesFromRouterTask([camelcase(name)]),
      },
    ],
    { collapse: false, exitOnError: true }
  )

export const handler = async ({ name, path }) => {
  const tasks = tasks({ name, path })
  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
