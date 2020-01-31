import path from 'path'

import concurrently from 'concurrently'

import { asyncExec } from 'src/lib'

const installedPackages = async () => {
  const { stdout } = await asyncExec('yarn list --pattern "@redwoodjs"')
  return Array.from(
    new Set(stdout.match(/@redwoodjs\/(.+)@/g).map((s) => s.slice(0, -1)))
  )
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

const build = async ({ args }) => {
  const relativePath = args?.[0]?.[2]

  if (!relativePath) {
    console.error('You must supply a redwood project path.')
  }

  const redwoodPath = path.resolve(relativePath)
  const redwoodPackages = await installedPackages()

  const runMe = redwoodPackages.map((pkgName) => {
    const pkgPath = path.resolve(
      redwoodPath,
      pkgName.replace('@redwoodjs/', 'packages/')
    )
    return { command: `yarn --cwd ${pkgPath} build:watch` }
  })

  concurrently(runMe)
}

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

  commands[subcommandToRun]({ args })

  return null
}

export const commandProps = {
  name: 'self',
  hidden: true,
  description: 'Commands that are helful when developing Redwood itself',
}
