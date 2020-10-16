import execa from 'execa'
import Listr from 'listr'
import terminalLink from 'terminal-link'
import { runCommandTask } from 'src/lib'
import { getConfig, shutdownPort } from '@redwoodjs/internal'

import c from 'src/lib/colors'

export const command = 'upgrade'
export const description = 'Upgrade all @redwoodjs packages via interactive CLI'

export const builder = (yargs) => {
  yargs
    .example(
      'rw upgrade -t 0.20.1-canary.5',
      'Specify a version. URL for Version History:\nhttps://www.npmjs.com/package/@redwoodjs/core'
    )
    .option('dry-run', {
      alias: 'd',
      description: 'Check for outdated packages without upgrading',
      type: 'boolean',
    })
    .option('tag', {
      alias: 't',
      description:
        '[choices: "canary", "rc", or specific-version (see example below)] WARNING: "canary" and "rc" tags are unstable releases!',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#upgrade'
      )}`
    )
    // Just to make an empty line
    .epilogue('')
    .epilogue(
      `We are < v1.0.0, so breaking changes occur frequently. For more information on the current release, see the ${terminalLink(
        'release page',
        'https://github.com/redwoodjs/redwood/releases'
      )}`
    )
}

const rwPackages =
  '@redwoodjs/core @redwoodjs/api @redwoodjs/web @redwoodjs/router @redwoodjs/auth @redwoodjs/forms'

// yarn upgrade-interactive does not allow --tags, so we resort to this mess
// @redwoodjs/auth may not be installed so we add check
const installTags = (tag, isAuth) => {
  const mainString = `yarn upgrade @redwoodjs/core@${tag} \
  && yarn workspace api upgrade @redwoodjs/api@${tag} \
  && yarn workspace web upgrade @redwoodjs/web@${tag} @redwoodjs/router@${tag} @redwoodjs/forms@${tag}`

  const authString = ` @redwoodjs/auth@${tag}`

  if (isAuth) {
    return mainString + authString
  } else {
    return mainString
  }
}

const prismaUpdate = () => {
  /** Relates to prisma/client issue, @see: https://github.com/redwoodjs/redwood/issues/1083
   * Here we specifically regenerate @prisma/client using prisma's own magic.*/
  return [
    {
      title: '...',
      task: async (_ctx, _task) => {
        try {
          const { stdout } = await execa.command(
            'yarn rw db up'
          )
        } catch (e) {
          console.error(
            `Error whilst updating @prisma/client (./node_modules/.prisma): ${c.error(e.message)}`
          )
        }
      },
    },
  ]
}

const rebootDev = () => {
  /** Relates to prisma/client issue, @see: https://github.com/redwoodjs/redwood/issues/1083
   * Here we reboot the dev server so it uses the newly generated @prisma/client. Usually that does the trick! */
  return [
    {
      title: '...',
      task: async (_ctx, _task) => {
        try {
          const { stdout } = await execa.command(
            'yarn rw dev'
          )
        } catch (e) {
          console.error(
            `Error whilst rebooting the dev server: ${c.error(e.message)}
            \n\nYou may wish to do it manually.`
          )
        }
      },
    },
  ]
}

const checkInstalled = () => {
  return [
    {
      // yarn upgrade will install listed packages even if not already installed
      // this is a workaround to check for Auth install and then add to options if true
      // TODO: this will not support cases where api/ or web/ do not exist;
      // need to build a list of installed and use reference object to map commands
      title: '...',
      task: async (ctx, task) => {
        try {
          const { stdout } = await execa.command(
            'yarn list --depth 0 --pattern @redwoodjs/auth'
          )
          if (stdout.includes('redwoodjs/auth')) {
            ctx.auth = true
            task.title = 'Found @redwoodjs/auth'
          } else {
            task.title = 'Done'
          }
        } catch (e) {
          task.skip('"yarn list ..." caused an Error')
          console.log(c.error(e.message))
        }
      },
    },
  ]
}

// yargs allows passing the 'dry-run' alias 'd' here,
// which we need to use because babel fails on 'dry-run'
const runUpgrade = ({ d, tag }) => {
  return [
    {
      title: '...',
      task: (ctx, task) => {
        if (d) {
          task.title = tag
            ? 'The --dry-run option is not supported for --tags'
            : 'Checking available upgrades for @redwoodjs packages'
          // 'yarn outdated --scope @redwoodjs' will include netlify plugin
          // so we have to use hardcoded list,
          // which will NOT display info for uninstalled packages
          if (!tag) {
            execa.command(`yarn outdated ${rwPackages}`, {
              stdio: 'inherit',
            })
          } else {
            throw new Error()
          }
          // using @tag with workspaces limits us to use 'upgrade' with full list
        } else if (tag) {
          task.title = `Force upgrading @redwoodjs packages to latest ${tag} release`
          execa.command(installTags(tag, ctx.auth), {
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
  ]
}

export const handler = async ({ d, tag }) => {
  // structuring as nested tasks to avoid bug with task.title causing duplicates
  const tasks = new Listr(
    [
      {
        title: 'Checking installed packages',
        task: () => new Listr(checkInstalled()),
      },
      {
        title: 'Running upgrade command',
        task: () => new Listr(runUpgrade({ d, tag })),
      },
      {
        title: 'Running prisma client update',
        task: () => new Listr(prismaUpdate({ d, tag })),
      },
      {
        title: 'Restarting the dev server',
        task: () => new Listr(rebootDev({ d, tag })),
      },

    ],
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
