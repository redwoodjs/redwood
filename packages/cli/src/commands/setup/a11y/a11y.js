import execa from 'execa'
import Listr from 'listr'

import c from 'src/lib/colors'

export const command = 'a11y'
export const description = 'Build accessible websites with this a11y setup'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async () => {
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      task: async () => {
        await execa('yarn', [
          'workspace',
          'web',
          'add',
          'eslint-plugin-jsx-a11y',
        ])
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
