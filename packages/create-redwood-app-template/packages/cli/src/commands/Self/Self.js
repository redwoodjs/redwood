import { getPaths } from '@redwoodjs/core'

const installedPackages = (pattern = '@redwoodjs') => {
  //➜ yarn list --pattern "@redwoodjs" --depth=0
  // ├─ @redwoodjs/api@0.0.1-alpha.22
  // ├─ @redwoodjs/cli@0.0.1-alpha.22
  // ├─ @redwoodjs/core@0.0.1-alpha.22
  // ├─ @redwoodjs/dev-server@0.0.1-alpha.22
  // ├─ @redwoodjs/eslint-config@0.0.1-alpha.22
  // ├─ @redwoodjs/eslint-plugin-redwood@0.0.1-alpha.22
  // ├─ @redwoodjs/router@0.0.1-alpha.22
  // ├─ @redwoodjs/scripts@0.0.1-alpha.22
  // └─ @redwoodjs/web@0.0.1-alpha.22
}

/**
 * The self commands are used during development of the RedwoodJS project.
 *
 * `self link`    - Links all of the redwood packages to the current project folder.
 */
export default ({ args }) => {
  const redwoodPaths = getPaths()

  return null
}

export const commandProps = {
  name: 'self',
  hidden: true,
  description: 'Commands that are helful when developing Redwood itself',
}
