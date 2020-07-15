import fs from 'fs'
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

  // Hacky workaround to get storybook to serve a `/public` folder.
  const storybookPublic = path.join(getPaths().cache, 'public')
  fs.mkdirSync(storybookPublic, { recursive: true })
  // Create a symlink to the "real" public path on web,
  // so that we can acces /public/<realPublicFiles>
  // https://github.com/storybookjs/storybook/issues/714
  try {
    fs.symlinkSync(
      path.join(getPaths().web.src, 'public'),
      path.join(storybookPublic, 'public'),
      { type: 'dir' }
    )
  } catch (e) {
    // do not do anything
  }

  // Create the MSW file.
  execa(storybookPublic, [`yarn msw init ${storybookPublic}`], {
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
      `-s ${storybookPublic}`,
    ],
    {
      stdio: 'inherit',
      shell: true,
      cwd,
    }
  )
}
