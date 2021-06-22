// inspired by gatsby/packages/gatsby-cli/src/create-cli.js and
// and gridsome/packages/cli/lib/commands/info.js
import envinfo from 'envinfo'
import terminalLink from 'terminal-link'

export const command = 'info'
export const description = 'Print your system environment information'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#info'
    )}`
  )
}
export const handler = async () => {
  try {
    const output = await envinfo.run({
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
    process.exit(1)
  }
}
