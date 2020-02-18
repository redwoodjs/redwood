import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'up'
export const desc = 'Generate the Prisma client and apply migrations.'
export const builder = {
  verbose: { type: 'boolean', default: false, alias: ['v'] },
}

export const handler = async ({ verbose }) => {
  const execaOpts = {
    shell: true,
    cwd: `${getPaths().base}/api`,
    stdio: verbose ? 'inherit' : 'pipe',
  }

  const tasks = new Listr(
    [
      {
        title: 'Migrating your database up...',
        task: async () => {
          return execa(
            'yarn prisma2',
            ['migrate up', '--create-db', '--experimental'],
            execaOpts
          )
        },
      },
      {
        title: 'Generating Prisma2 client...',
        task: async () => {
          return execa('yarn prisma2', ['generate'], execaOpts)
        },
      },
    ],
    {
      renderer: verbose && VerboseRenderer,
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
