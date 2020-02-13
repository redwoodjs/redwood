import execa from 'execa'
import Listr from 'listr'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'generate'
export const desc = 'Generate the prisma2 client.'

export const handler = async () => {
  const tasks = new Listr([
    {
      title: 'Generating database client...',
      task: async () => {
        return execa('yarn prisma2', ['generate'], {
          shell: true,
          cwd: `${getPaths().base}/api`,
        })
      },
    },
  ])
  tasks.run()
}
