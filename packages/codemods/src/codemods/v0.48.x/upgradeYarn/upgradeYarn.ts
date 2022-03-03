import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import getRWPaths from '../../../lib/getRWPaths'

async function upgradeYarn() {
  const rwPaths = getRWPaths()

  // Projects need to be on node v14.9.0 or greater for corepack to work.
  const [major, minor] = process.version.replace('v', '').split('.').map(Number)

  if (major < 14) {
    console.log('You have to be on node v14.9.0 or greater')
    process.exit(1)
  }

  if (major === 14 && minor < 9) {
    console.log('You have to be on node v14.9.0 or greater')
    process.exit(1)
  }

  console.log('Enabling corepack...')
  spawnSync('corepack enable', {
    shell: true,
    cwd: rwPaths.base,
  })

  console.log('Setting yarn version to 3...')

  spawnSync('yarn set version stable', {
    shell: true,
    cwd: rwPaths.base,
  })

  const { stdout } = spawnSync('yarn --version', {
    shell: true,
    cwd: rwPaths.base,
  })

  const yarnVersion = stdout.toString().trim()

  console.log()
  console.log('Writing .yarnrc.yml and appending to .gitignore...')

  fs.writeFileSync(
    path.join(rwPaths.base, '.yarnrc.yml'),

    [
      'compressionLevel: 0',
      '',
      'enableGlobalCache: true',
      '',
      'nmMode: hardlinks-local',
      '',
      'nodeLinker: node-modules',
      '',
      `yarnPath: .yarn/releases/yarn-${yarnVersion}.cjs`,
    ].join('\n')
  )

  const gitignorePath = path.join(rwPaths.base, '.gitignore')
  const gitignore = fs.readFileSync(gitignorePath)
  fs.writeFileSync(
    path.join(gitignorePath),
    `${gitignore}${[
      '.pnp.*',
      '.yarn/*',
      '!.yarn/patches',
      '!.yarn/plugins',
      '!.yarn/releases',
      '!.yarn/sdks',
      '!.yarn/versions',
    ].join('\n')}`
  )

  console.log('Installing...')
  spawnSync('yarn install', {
    shell: true,
    cwd: rwPaths.base,
    stdio: 'inherit',
  })

  console.log()
  console.log('Done! Be sure to commit the changes')
}

export default upgradeYarn
