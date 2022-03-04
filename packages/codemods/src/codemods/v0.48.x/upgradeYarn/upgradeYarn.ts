import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import getRWPaths from '../../../lib/getRWPaths'

async function upgradeYarn() {
  const rwPaths = getRWPaths()

  console.log('Enabling corepack...')

  const { status, ...rest } = spawnSync('corepack enable', {
    shell: true,
    cwd: rwPaths.base,
  })

  if (status !== 0) {
    throw new Error(
      [
        '',
        'Failed to enable corepack:',
        '',
        `  ${rest.stderr.toString().trim()}`,
        '',
        'Your node version may be less than v14.19',
        'Please install corepack globally via ',
        '',
        '  npm install -g corepack',
        '',
        'For more information, see:',
        '- https://yarnpkg.com/getting-started/install',
        '- https://nodejs.org/dist/latest/docs/api/corepack.html',
      ].join('\n')
    )
  }

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
  console.log('Adding .yarnrc.yml and updating .gitignore...')

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
