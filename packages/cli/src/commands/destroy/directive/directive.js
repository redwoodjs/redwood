import Listr from 'listr'

import { deleteFilesTask } from '../../../lib'
import c from '../../../lib/colors'
import { files as directiveFiles } from '../../generate/directive/directive'

export const command = 'directive <name> <type>'
export const description = 'Destroy a Directive'

export const builder = (yargs) => {
  yargs.positional('name', {
    description: 'Name of the Directive',
    type: 'string',
  })
  yargs.positional('type', {
    description: 'Type of the Directive',
    type: 'string',
  })
}

export const tasks = ({ name, type }) =>
  new Listr(
    [
      {
        title: `Destroying directive files...`,
        task: async () => {
          const f = await directiveFiles({
            name,
            type,
            tests: true,
          })
          return deleteFilesTask(f)
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )

export const handler = async (options) => {
  const t = tasks(options)
  try {
    await t.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
