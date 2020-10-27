import execa from 'execa'
import terminalLink from 'terminal-link'
import { ensurePosixPath } from '@redwoodjs/internal'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

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
export const description = 'Run Jest tests. Defaults to watch mode'
export const builder = (yargs) => {
  const { getProject } = require('@redwoodjs/structure')
  yargs
    .choices('side', getProject().sides)
    .option('watch', {
      describe:
        'Run tests related to changed files based on hg/git. Specify the name or path to a file to focus on a specific set of tests',
      type: 'boolean',
      default: false,
    })
    .option('watchAll', {
      describe: 'Run all tests',
      type: 'boolean',
      default: false,
    })
    .option('collectCoverage', {
      describe:
        'Show test coverage summary and output info to coverage directory',
      type: 'boolean',
      default: false,
    })
    .option('clearCache', {
      describe:
        'Delete the Jest cache directory and exit without running tests',
      type: 'boolean',
      default: false,
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#test'
      )}`
    )
}

export const handler = async ({
  side,
  watch = false,
  watchAll = false,
  collectCoverage = false,
}) => {
  const { cache: CACHE_DIR } = getPaths()
  const sides = [].concat(side).filter(Boolean)
  const args = [
    '--passWithNoTests',
    watch && '--watch',
    collectCoverage && '--collectCoverage',
    watchAll && '--watchAll',
  ].filter(Boolean)
  // If you don't pass any arguments we enter "watch mode" as the default.
  if (!process.env.CI && !watchAll && !collectCoverage) {
    // https://github.com/facebook/create-react-app/issues/5210
    const hasSourceControl = isInGitRepository() || isInMercurialRepository()
    args.push(hasSourceControl ? '--watch' : '--watchAll')
  }
  args.push(
    '--config',
    require.resolve('@redwoodjs/core/config/jest.config.js')
  )
  if (sides.length > 0) {
    args.push('--projects', ...sides)
  }
  try {
    // Create a test database
    if (sides.includes('api')) {
      const cacheDirDb = `file:${ensurePosixPath(CACHE_DIR)}/test.db`
      const DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb
      await execa.command(`yarn rw db up`, {
        stdio: 'inherit',
        shell: true,
        env: { DATABASE_URL },
      })
    }
    // **NOTE** There is no official way to run Jest programatically,
    // so we're running it via execa, since `jest.run()` is a bit unstable.
    // https://github.com/facebook/jest/issues/5048
    execa('yarn jest', args, {
      cwd: getPaths().base,
      shell: true,
      stdio: 'inherit',
    })
  } catch (e) {
    console.log(c.error(e.message))
  }
}
