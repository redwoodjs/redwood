import path from 'path'

import execa from 'execa'

import { getPaths } from '@redwoodjs/internal'

export const command = 'storybook'
export const aliases = ['sb']
export const description =
  'Launch Storybook, an isolated component development environment'

export const builder = (yargs) => {
  yargs
    .option('open', {
      describe: 'Open storybooks in your browser on start',
      type: 'boolean',
      default: false,
    })
    .option('port', {
      describe: 'Which port to run storybooks on',
      type: 'integer',
      default: 7910,
    })
}

export const handler = ({ open, port }) => {
  const cmd = 'yarn start-storybook'
  const cwd = getPaths().web.base

  const staticAssetsFolder = path.join(getPaths().web.base, 'public')

  // Create the `MockServiceWorker.js` file.
  execa(`yarn msw init "${staticAssetsFolder}"`, undefined, {
    stdio: 'inherit',
    shell: true,
    cwd,
  })

  const options = [
    '--config-dir ../node_modules/@redwoodjs/core/config/storybook',
    `--port ${port}`, // this should be configurable?
    '--no-version-updates', // we'll handle upgrades
    `--static-dir "${staticAssetsFolder}"`,
  ]

  if (!open) {
    options.push('--ci')
  }

  execa(cmd, options, {
    stdio: 'inherit',
    shell: true,
    cwd,
  })
}
