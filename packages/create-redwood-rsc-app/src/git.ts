import { execa } from 'execa'

import type { Config } from './config.js'

export async function initialCommit(config: Config) {
  if (config.verbose) {
    console.log('Running `git init .`')
  }
  await execa({ cwd: config.installationDir })`git init .`

  if (config.verbose) {
    console.log('Running `git add .`')
  }
  await execa({ cwd: config.installationDir })`git add .`

  if (config.verbose) {
    console.log('Running `git commit`')
  }
  await execa({
    cwd: config.installationDir,
  })`git commit -m ${'Initial commit'}`
}
