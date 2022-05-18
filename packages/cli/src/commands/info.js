/**
 * Inspired by:
 *
 * - https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-cli/src/create-cli.ts
 * - https://github.com/gridsome/gridsome/blob/master/packages/cli/lib/commands/info.js
 */

export const command = 'info'

export const description = 'Print environment information'

export async function builder(yargs) {
  const { default: terminalLink } = await import('terminal-link')

  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#info'
    )}`
  )
}

export async function handler() {
  const { run } = await import('envinfo')

  try {
    const output = await run({
      System: ['OS', 'Shell'],
      Binaries: ['Node', 'Yarn'],
      Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
      // yarn workspaces not supported :-/
      npmPackages: '@redwoodjs/*',
      Databases: ['SQLite'],
    })
    console.log(output)
  } catch (e) {
    console.log('Error: Cannot access environment info')
    console.log(e)
    process.exitCode = 1
  }
}
