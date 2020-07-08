import execa from 'execa'
import terminalLink from 'terminal-link'
import createJestConfig from '@redwoodjs/core/config/jest.config'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

const jest = require('jest')

// TODO: Get from redwood.toml
const sides = {
  web: {
    target: 'browser',
  },
  api: {
    target: 'node',
  },
}

// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/scripts/test.js#L39
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
export const description = 'Run Jest tests for api and web'
export const builder = (yargs) => {
  yargs
    .choices('side', Object.keys(sides))
    .default('side', Object.keys(sides))
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

export const handler = async ({
  side: sides,
  watch,
  watchAll,
  collectCoverage,
}) => {
  const { cache: CACHE_DIR } = getPaths()

  const args = [
    '--passWithNoTests',
    watch && '--watch',
    collectCoverage && '--collectCoverage',
    watchAll && '--watchAll',
  ].filter(Boolean)

  // Watch unless on CI or explicitly running all tests
  if (!process.env.CI && !watchAll) {
    // https://github.com/facebook/create-react-app/issues/5210
    const hasSourceControl = isInGitRepository() || isInMercurialRepository()
    args.push(hasSourceControl ? '--watch' : '--watchAll')
  }

  // Dynamically build Jest config for all sides
  const jestConfig = createJestConfig({ sides })
  args.push('--config', JSON.stringify(jestConfig))

  try {
    /**
     * Migrate test database. This should be moved to somehow be done on a
     * per-side basis if possible.
     */

    const DATABASE_URL =
      process.env.TEST_DATABASE_URL || `file:${CACHE_DIR}/test.db`

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
