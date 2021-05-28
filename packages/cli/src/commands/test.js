import execa from 'execa'
import terminalLink from 'terminal-link'

import { ensurePosixPath } from '@redwoodjs/internal'
import { getProject } from '@redwoodjs/structure'

import { getPaths } from 'src/lib'

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
  yargs
    .positional('side', {
      choices: getProject().sides,
      default: getProject().sides,
      description: 'Which side(s) to test',
      type: 'array',
    })
    .option('watch', {
      describe:
        'Run tests related to changed files based on hg/git. Specify the name or path to a file to focus on a specific set of tests',
      type: 'boolean',
      default: true,
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
    .option('db-push', {
      describe:
        "Syncs the test database with your Prisma schema. It creates a test database if it doesn't already exist.",
      type: 'boolean',
      default: true,
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
  watch = true,
  collectCoverage = false,
  dbPush = true,
}) => {
  const { cache: CACHE_DIR } = getPaths()
  const sides = [].concat(side).filter(Boolean)
  const args = [
    '--passWithNoTests',
    collectCoverage && '--collectCoverage',
  ].filter(Boolean)

  // If the user wants to watch, set the proper watch flag based on what kind of repo this is
  // because of https://github.com/facebook/create-react-app/issues/5210
  if (watch && !process.env.CI && !collectCoverage) {
    const hasSourceControl = isInGitRepository() || isInMercurialRepository()
    args.push(hasSourceControl ? '--watch' : '--watchAll')
  }

  // if no sides declared with yargs, default to all sides
  if (!sides.length) {
    getProject().sides.forEach((side) => sides.push(side))
  }

  if (sides.includes('api')) {
    args.push('--runInBand')
  }

  args.push(
    '--config',
    `"${require.resolve('@redwoodjs/core/config/jest.config.js')}"`
  )

  if (sides.length > 0) {
    args.push('--projects', ...sides)
  }

  try {
    const cacheDirDb = `file:${ensurePosixPath(CACHE_DIR)}/test.db`
    const DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb

    if (sides.includes('api') && dbPush) {
      // Sync||create test database
      await execa(
        `yarn rw`,
        ['prisma db push', '--force-reset', '--accept-data-loss'],
        {
          cwd: getPaths().api.base,
          stdio: 'inherit',
          shell: true,
          env: { DATABASE_URL },
        }
      )
    }

    // **NOTE** There is no official way to run Jest programmatically,
    // so we're running it via execa, since `jest.run()` is a bit unstable.
    // https://github.com/facebook/jest/issues/5048
    await execa('yarn jest', args, {
      cwd: getPaths().base,
      shell: true,
      stdio: 'inherit',
      env: { DATABASE_URL },
    })
  } catch (e) {
    // Errors already shown from execa inherited stderr
    process.exit(e?.exitCode || 1)
  }
}
