import path from 'path'

import execa from 'execa'

import { getPaths } from '@redwoodjs/internal'

export const command = 'storybook'
export const aliases = ['sb']
export const description =
  'Launch Storybook, an isolated component development environment'

export const handler = () => {
  const cmd = 'yarn start-storybook'
  const cwd = getPaths().web.base

  const staticAssetsFolder = path.join(getPaths().web.base, 'public')

  // Create the `MockServiceWorker.js` file.
  execa(`yarn msw init ${staticAssetsFolder}`, undefined, {
    stdio: 'inherit',
    shell: true,
    cwd,
  })

  execa(
    cmd,
    [
      '--config-dir ../node_modules/@redwoodjs/core/config/storybook',
      '--port 7910', // this should be configurable?
      '--no-version-updates', // we'll handle upgrades
      '--ci', // do not open browser window.
      `--static-dir ${staticAssetsFolder}`,
    ],
    {
      stdio: 'inherit',
      shell: true,
      cwd,
    }
  )
}
