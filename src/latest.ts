import type { Config } from './config.js'

import { execa } from 'execa'

export async function shouldRelaunch(config: Config) {
  if (config.verbose) {
    console.log('shouldRelaunch process.argv', process.argv)
  }

  if (!process.argv.join(' ').includes('npx')) {
    // Not running via npx (so probably running in dev mode, or running tests)
    return false
  }

  const versionIsSpecified =
    /@\d+/.test(process.argv.join(' ')) ||
    /@latest/.test(process.argv.join(' '))

  if (config.verbose) {
    console.log('Version is specified:', versionIsSpecified)
  }

  return !versionIsSpecified
}

export async function relaunchOnLatest(config: Config) {
  if (config.verbose) {
    console.log('relaunchOnLatest process.argv', process.argv)
  }

  await execa({
    stdio: 'inherit',
  })`npx @tobbe.dev/create-redwood-rsc-app@latest ${process.argv.slice(2)}`
}
