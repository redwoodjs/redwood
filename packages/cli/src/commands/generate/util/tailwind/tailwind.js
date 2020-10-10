import execa from 'execa'

import c from 'src/lib/colors'

// ********
// Deprecated as of September 2020
// Use "setup" command
// ********

export const command = 'tailwind'
export const description = 'WARNING: deprecated. Use "yarn rw setup" command.'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async ({ force }) => {
  const cmd = force
    ? 'yarn rw setup tailwind --force'
    : 'yarn rw setup tailwind'
  try {
    console.log(c.warning('\n' + 'WARNING: deprecated "util" command'))
    console.log(
      c.green('See "setup" command: ') +
        'https://redwoodjs.com/reference/command-line-interface#setup' +
        '\n'
    )
    await execa(cmd, {
      stdio: 'inherit',
      shell: true,
    })
  } catch (e) {
    console.log(c.error(e.message))
  }
}
