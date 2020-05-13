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
    .option('canary', {
      type: 'boolean',
      default: false,
      description:
        'WARNING: Force upgrades packages to most recent, unstable release from master branch',
    })
    .strict()
}

const rwPackages =
  '@redwoodjs/core @redwoodjs/api @redwoodjs/web @redwoodjs/router'

// yarn upgrade-interactive does not allow tags, so we resort to this mess
const installCanaryCommand =
  'yarn workspace api upgrade @redwoodjs/api@canary' +
  '&& yarn workspace web upgrade @redwoodjs/web@canary @redwoodjs/router@canary' +
  '&& yarn upgrade @redwoodjs/core@canary'

// yargs allows passing the 'dry-run' alias 'd' here,
// which we need to use because babel fails on 'dry-run'
export const handler = async ({ d, canary }) => {
  const tasks = new Listr([
    {
      title: "Running 'redwood upgrade'",
      task: (_ctx, task) => {
        if (d) {
          task.title = canary
            ? 'The --dry-run option is not supported for --canary'
            : 'Checking available upgrades for @redwoodjs packages'
          if (!canary) {
            execa.command(`yarn outdated ${rwPackages}`, {
              stdio: 'inherit',
              shell: true,
            })
          }
        } else if (canary) {
          task.title =
            'Force upgrading @redwoodjs packages to latest canary release'
          execa.command(installCanaryCommand, {
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
