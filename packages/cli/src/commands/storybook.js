import path from 'path'

import execa from 'execa'
import { getPaths } from '@redwoodjs/internal'

export const command = 'storybook'
export const aliases = ['sb']
export const description =
  'Launch Storybook: An isolate component development environment.'

export const builder = (yargs) => {
  yargs
    .option('open', {
      describe: 'Open storybooks in your browser on start',
      type: 'boolean',
      default: false,
    })
    .option('build', {
      describe: 'Build Storybook',
      type: 'boolean',
      default: false,
    })
    .option('port', {
      describe: 'Which port to run storybooks on',
      type: 'integer',
      default: 7910,
    })
}

export const handler = ({ open, port, build }) => {
  const cwd = getPaths().web.base

  const staticAssetsFolder = path.join(getPaths().web.base, 'public')
  // Create the `MockServiceWorker.js` file.
  execa(`yarn msw init "${staticAssetsFolder}"`, undefined, {
    stdio: 'inherit',
    shell: true,
    cwd,
  })

  execa(
    `yarn ${build ? 'build' : 'start'}-storybook`,
    [
      '--config-dir ../node_modules/@redwoodjs/core/config/storybook',
      `--port ${port}`,
      '--no-version-updates',
      `--static-dir "${staticAssetsFolder}"`,
      !open && '--ci',
    ].filter(Boolean),
    {
      stdio: 'inherit',
      shell: true,
      cwd,
    }
  )
}
