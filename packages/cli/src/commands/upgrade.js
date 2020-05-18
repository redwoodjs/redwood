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
  '@redwoodjs/core @redwoodjs/api @redwoodjs/web @redwoodjs/router @redwoodjs/auth'

// yarn upgrade-interactive does not allow --tags, so we resort to this mess
// @redwoodjs/auth may not be installed so we don't include here
let installCanaryCommand =
  // 'yarn upgrade @redwoodjs/core@canary' +
  // ' && yarn workspace api upgrade @redwoodjs/api@canary' +
  // ' && yarn workspace web upgrade @redwoodjs/web@canary @redwoodjs/router@canary'
  'yarn workspace web upgrade @redwoodjs/web@canary'

// yargs allows passing the 'dry-run' alias 'd' here,
// which we need to use because babel fails on 'dry-run'
export const handler = async ({ d, canary }) => {
  const tasks = new Listr([
    {
      // yarn upgrade will install listed packages even if not already installed
      // this is a hack to check for install and then add to options if true
      title: 'Checking installed packages...',
      task: async (_ctx, task) => {
        try {
          const { stdout } = await execa.command(
            'yarn list --depth 0 --pattern @redwoodjs/auth'
          )
          console.log('===this is stdout===\n', stdout)
          if (stdout.includes('redwoodjs/auth')) {
            installCanaryCommand += ' @redwoodjs/auth@canary'
            task.title = 'Checking installed packages... found @redwoodjs/auth'
          } else {
            task.title = 'Checking installed packages... done'
          }
        } catch (e) {
          task.skip('"yarn list ..." caused an Error')
          console.log(c.error(e.message))
        }
      },
    },
    {
      title: "Running 'redwood upgrade'",
      task: (_ctx, task) => {
        if (d) {
          task.title = canary
            ? 'The --dry-run option is not supported for --canary'
            : 'Checking available upgrades for @redwoodjs packages'
          // 'yarn outdated --scope @redwoodjs' will include netlify plugin ¯\_(ツ)_/¯
          // so we have to use hardcoded list,
          // which will NOT display info for uninstalled packages
          if (!canary) {
            execa.command(`yarn outdated ${rwPackages}`, {
              stdio: 'inherit',
              shell: true,
            })
          }
          // using @tag with workspaces limits us to 'upgrade' with full list
        } else if (canary) {
          task.title =
            'Force upgrading @redwoodjs packages to latest canary release'
          execa.command(installCanaryCommand, {
            stdio: 'inherit',
            shell: true,
          })
        } else {
          task.title = 'Running @redwoodjs package interactive upgrade CLI'
          execa(
            'yarn upgrade-interactive',
            ['--scope @redwoodjs', '--latest'],
            {
              stdio: 'inherit',
              shell: true,
            }
          )
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
