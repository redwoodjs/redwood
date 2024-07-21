import { execa } from 'execa'
import fs from 'node:fs'
import path from 'node:path'

import type { Config } from './config.js'

export async function install(config: Config) {
  console.log('🐈 Running `yarn install`')
  console.log('    ⏳ This might take a while...')

  // This allows us to run `yarn install` even if the parent directory is
  // another node project (like if you try to set it up in a sub-directory if
  // this project)
  fs.writeFileSync(path.join(config.installationDir, 'yarn.lock'), '')

  await execa({ cwd: config.installationDir })`yarn install`
}
