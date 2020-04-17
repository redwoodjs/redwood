import execa from 'execa'
import Listr from 'listr'

import c from 'src/lib/colors'

export const command = 'upgrade'
export const desc = 'Upgrade all @redwoodjs packages via interactive CLI'

export const builder = (yargs) => {
  yargs
    .option('dry-run', {
      alias: 'd',
      type: 'boolean',
      default: false,
      description: 'Check for outdated packages without upgrading',
    })
    .strict()
}

const rwPackages =
  '@redwoodjs/core @redwoodjs/api @redwoodjs/web @redwoodjs/router'

export const handler = async ({ dry-run }) => {
  const tasks = new Listr([
    {
      title: "Running 'redwood upgrade'",
      task: (_ctx, task) => {
        if (dry-run) {
          task.title = 'Checking available upgrades for @redwoodjs packages'
          execa(`yarn outdated ${rwPackages}`, undefined, {
            stdio: 'inherit',
            shell: true,
          })
        } else {
          task.title = 'Running @redwoodjs package interactive upgrade CLI'
          execa(`yarn upgrade-interactive ${rwPackages}`, ['--latest'], {
            stdio: 'inherit',
            shell: true,
          })
        }
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
