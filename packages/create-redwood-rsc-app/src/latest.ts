import { execa } from 'execa'
import fs from 'node:fs'

import type { Config } from './config.js'

export function shouldRelaunch(config: Config) {
  if (config.verbose) {
    console.log('shouldRelaunch process.argv', process.argv)
  }

  if (
    !/[/\\]_npx[/\\]/.test(process.argv[1]) &&
    // --npx is a hack for bypassing the check when running in dev if needed
    !process.argv.includes('--npx')
  ) {
    if (config.verbose) {
      console.log('/_npx/ not found in process.argv. Returning false')
    }

    // Not running via npx (so probably running in dev mode, or running tests)
    return false
  }

  if (process.argv.includes('--no-check-latest')) {
    if (config.verbose) {
      console.log('process.argv includes --no-check-latest. Returning false')
    }

    return false
  }

  const stat = fs.statSync(process.argv[1])
  const mtimeDiffInMinutes = (Date.now() - stat.mtimeMs) / 1000 / 60

  if (config.verbose) {
    console.log(process.argv[1], 'stat', stat)
    console.log('mtime diff in minutes', mtimeDiffInMinutes)
  }

  if (mtimeDiffInMinutes < 1) {
    if (config.verbose) {
      console.log('mtimeDiffInMinutes < 1. Returning false')
    }

    // If the file we're running is less than a minute old that means npx has
    // just downloaded and installed it. That most likely means the user did
    // not specify a version, but npx didn't have any version cached, so it
    // had to download one, and in that case it would have downloaded the
    // latest version. Or it means the user did specify a version and npx
    // didn't have it, so it downloaded it. If a user is explicit about what
    // version they want, we should respect that and not try to upgrade them.
    // The one problem here is if the user is explicit, but it's a version that
    // npx has already cached. Then it'll use that version and we will detect
    // that it's old, and so go on to relaunch with @latest specified, which is
    // probably not what the user wanted.
    //
    // TODO: Check what the latest version of the script is on npm, and compare
    // with the version that was run. If we're not running the latest version
    // we should ask the user if they want to upgrade.
    // "You're running version x.y.z of this script, but the latest version is
    // x.y.z. Do you want to upgrade? [y/N]"
    return false
  }

  return true
}

export async function relaunchOnLatest(config: Config) {
  if (config.verbose) {
    console.log('relaunchOnLatest process.argv', process.argv)
  }

  const args = [...process.argv.slice(2), '--no-check-latest']

  if (config.verbose) {
    console.log(
      'cmd',
      `npx @tobbe.dev/create-redwood-rsc-app@latest ${args.join()}`,
    )
  }

  await execa({
    stdio: 'inherit',
    env: {
      npm_config_yes: 'true',
    },
  })`npx @tobbe.dev/create-redwood-rsc-app@latest ${args}`
}
