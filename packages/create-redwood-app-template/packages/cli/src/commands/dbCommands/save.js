import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'save [name..]'
export const desc = 'Create a new migration.'

export const handler = async ({ name }) => {
  const execaOpts = {
    shell: true,
    cwd: `${getPaths().base}/api`,
    stdio: 'inherit',
  }

  const tasks = new Listr(
    [
      {
        title: 'Migrating your database up...',
        task: async () => {
          return execa(
            'yarn prisma2',
            ['migrate save', name && `--name ${name}`, '--experimental'],
            execaOpts
          )
        },
      },
    ],
    {
      renderer: VerboseRenderer,
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
