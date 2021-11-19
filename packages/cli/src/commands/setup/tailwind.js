import execa from 'execa'

import c from '../../lib/colors'

// ********
// Deprecated as of November 2021
// Use "setup ui <library>" command
// ********

export const command = 'tailwind'
export const description = false

export const handler = async () => {
  try {
    console.log(c.warning('\n' + 'WARNING: deprecated "tailwind" command'))
    console.log(
      c.green('See "rw setup ui tailwindcss" command: ') +
        'https://redwoodjs.com/reference/command-line-interface#ui' +
        '\n'
    )
    await execa('yarn rw setup ui tailwindcss', {
      stdio: 'inherit',
      shell: true,
    })
  } catch (e) {
    console.log(c.error(e.message))
  }
}
