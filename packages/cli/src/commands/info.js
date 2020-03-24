// inspired by gatsby/packages/gatsby-cli/src/create-cli.js and
// and gridsome/packages/cli/lib/commands/info.js
import envinfo from 'envinfo'
import clipboardy from 'clipboardy'

export const command = 'info'
export const desc = 'Get environment information'
export const builder = {
  clipboard: {
    alias: `C`,
    type: `boolean`,
    default: false,
    describe: `Copy info to clipboard`,
  },
}
export const handler = (args) => {
  try {
    const copyToClipboard =
      // linux tty not supported by clipboardy
      process.platform === `linux` && !process.env.DISPLAY
        ? false
        : args.clipboard

    envinfo
      .run({
        System: ['OS', 'Shell'],
        Binaries: ['Node', 'Yarn'],
        Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
        // yarn workspaces not supported :-/
        npmPackages: ['@redwoodjs/core'],
        Databases: ['SQLite'],
      })
      .then((envinfoOutput) => {
        console.log(envinfoOutput)

        if (copyToClipboard) {
          clipboardy.writeSync(envinfoOutput)
          console.log('System info copied to clipboard ✂️ 📋\n')
        }
      })
  } catch (err) {
    console.log('Error: Cannot access environment info')
    console.log(err)
  }
}
