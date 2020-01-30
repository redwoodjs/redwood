import { promisify } from 'util'
import { exec } from 'child_process'

import { getPaths } from '@redwoodjs/core'

const asyncExec = promisify(exec)

const installedPackages = async (pattern = '@redwoodjs') => {
  const { stdout } = await asyncExec(`yarn list --pattern "${pattern}"`)
  return new Set(stdout.match(/@redwoodjs\/(.+)@/g).map((s) => s.slice(0, -1)))
}

const link = async () => {
  const redwoodPackages = await installedPackages()
  redwoodPackages.forEach(async (pkgName) => {
    console.log(`Linking ${pkgName}`)
    const { stderr } = await asyncExec(`yarn link '${pkgName}'`)
    if (stderr) {
      console.error(stderr)
    }
  })
}

const build = async () => { }

/**
 * The self commands are used during development of the RedwoodJS project.
 *
 * `self link`  - Links all of the Redwood packages to the current project folder.
 * `self build` - Builds all of the Redwood packages when a change is detected.
 */
export default ({ args }) => {
  const commands = {
    link,
    build,
  }

  const subcommandToRun = args?.[0]?.[1]
  if (!commands[subcommandToRun]) {
    console.warn(
      `self ${subcommandToRun} is a not a valid argument.\n\nCommands:\n${Object.keys(
        commands
      ).join('\n')}`
    )
    return null
  }

  commands[subcommandToRun]()

  return null
}

export const commandProps = {
  name: 'self',
  hidden: true,
  description: 'Commands that are helful when developing Redwood itself',
}
