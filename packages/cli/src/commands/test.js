import execa from 'execa'
import terminalLink from 'terminal-link'
import { getProject } from '@redwoodjs/structure'
import { ensurePosixPath } from '@redwoodjs/internal'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

const jest = require('jest')

// TODO: Get from redwood.toml
const sides = getProject().sides

// https://github.com/facebook/create-react-app/blob/cbad256a4aacfc3084be7ccf91aad87899c63564/packages/react-scripts/scripts/test.js#L39
function isInGitRepository() {
  try {
    execa.commandSync('git rev-parse --is-inside-work-tree')
    return true
  } catch (e) {
    return false
  }
}

function isInMercurialRepository() {
  try {
    execa.commandSync('hg --cwd . root')
    return true
  } catch (e) {
    return false
  }
}

export const command = 'test [side..]'
export const description = 'Run Jest tests'
export const builder = (yargs) => {
  yargs
    .choices('side', sides)
    .option('watch', {
      type: 'boolean',
    })
    .option('watchAll', {
      type: 'boolean',
    })
    .option('collectCoverage', {
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#test'
      )}`
    )
}

export const handler = async ({ side, watch, watchAll, collectCoverage }) => {
  const { cache: CACHE_DIR } = getPaths()
  const sides = [].concat(side).filter(Boolean)

  const args = [
    '--passWithNoTests',
    watch && '--watch',
    collectCoverage && '--collectCoverage',
    watchAll && '--watchAll',
  ].filter(Boolean)

  // Watch unless on CI or explicitly running all tests
  if (!process.env.CI && !watchAll && !collectCoverage) {
    // https://github.com/facebook/create-react-app/issues/5210
    const hasSourceControl = isInGitRepository() || isInMercurialRepository()
    args.push(hasSourceControl ? '--watch' : '--watchAll')
  }

  const jestConfigLocation = require.resolve(
    '@redwoodjs/core/config/jest.config.js'
  )
  args.push('--config', jestConfigLocation)

  if (sides.length > 0) {
    args.push('--projects', ...sides)
  }

  try {
    /**
     * Migrate test database. This should be moved to somehow be done on a
     * per-side basis if possible.
     */
    const cacheDirDb = `file:${ensurePosixPath(CACHE_DIR)}/test.db`
    const DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb

    await execa.command(`yarn rw db up`, {
      stdio: 'inherit',
      shell: true,
      env: { DATABASE_URL },
    })

    jest.run(args)
  } catch (e) {
    console.log(c.error(e.message))
  }
}
