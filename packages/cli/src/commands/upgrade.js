import execa from 'execa'
import Listr from 'listr'

import c from 'src/lib/colors'

export const command = 'upgrade'
export const desc = 'Upgrade all @redwoodjs packages via interactive CLI'

export const handler = async () => {
  const execCommands = {
    cmd:
      'yarn upgrade-interactive @redwoodjs/core @redwoodjs/api @redwoodjs/web @redwoodjs/router',
    args: ['--latest'],
  }

  const tasks = new Listr([
    {
      title: 'Running @redwoodjs Interactive Upgrade CLI',
      task: () => {
        const { cmd, args } = execCommands
        execa(cmd, args, {
          stdio: 'inherit',
          shell: true,
        })
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
