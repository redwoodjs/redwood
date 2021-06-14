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

export const command = 'test [filter..]'
export const description = 'Run Jest tests. Defaults to watch mode'
export const builder = (yargs) => {
  yargs
    .strict(false) // so that we can forward arguments to jest
    .positional('filter', {
      default: getProject().sides,
      description:
        'Which side(s) to test, and/or a regular expression to match against your test files to filter by',
      type: 'array',
    })
    .option('watch', {
      describe:
        'Run tests related to changed files based on hg/git. Specify the name or path to a file to focus on a specific set of tests',
      type: 'boolean',
      default: true,
    })
    .option('collect-coverage', {
      describe:
        'Show test coverage summary and output info to coverage directory',
      type: 'boolean',
      default: false,
    })
    .option('db-push', {
      describe:
        "Syncs the test database with your Prisma schema without requiring a migration. It creates a test database if it doesn't already exist.",
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
  filter: filterParams = [],
  watch = true,
  collectCoverage = false,
  dbPush = true,
  ...others
}) => {
  const rwjsPaths = getPaths()
  const forwardJestFlags = Object.keys(others).flatMap((flagName) => {
    if (
      ['watch', 'collect-coverage', 'db-push', '$0', '_'].includes(flagName)
    ) {
      // filter out flags meant for the rw test command only
      return []
    } else {
      // and forward on the other flags
      return [
        flagName.length > 1 ? `--${flagName}` : `-${flagName}`,
        others[flagName],
      ]
    }
  })

  // Only the side params
  const sides = filterParams.filter((filterString) =>
    getProject().sides.includes(filterString)
  )

  // All the other params, apart from sides
  const jestFilterArgs = [
    ...filterParams.filter(
      (filterString) => !getProject().sides.includes(filterString)
    ),
  ]

  const jestArgs = [
    ...jestFilterArgs,
    ...forwardJestFlags,
    collectCoverage ? '--collectCoverage' : null,
    '--passWithNoTests',
    ...jestFilterArgs,
    sides.includes('api') && '--runInBand',
  ].filter((flagOrValue) => flagOrValue !== null) // Filter out nulls, not booleans because user may have passed a --something false flag

  // If the user wants to watch, set the proper watch flag based on what kind of repo this is
  // because of https://github.com/facebook/create-react-app/issues/5210
  if (watch && !process.env.CI && !collectCoverage) {
    const hasSourceControl = isInGitRepository() || isInMercurialRepository()
    jestArgs.push(hasSourceControl ? '--watch' : '--watchAll')
  }

  // if no sides declared with yargs, default to all sides
  if (!sides.length) {
    getProject().sides.forEach((side) => sides.push(side))
  }

  jestArgs.push(
    '--config',
    `"${require.resolve('@redwoodjs/testing/config/jest/jest.config.js')}"`
  )

  if (sides.length > 0) {
    jestArgs.push('--projects', ...sides)
  }

  try {
    const cacheDirDb = `file:${ensurePosixPath(
      rwjsPaths.generated.base
    )}/test.db`
    const DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb

    if (sides.includes('api') && dbPush) {
      // Sync||create test database
      await execa(
        `yarn rw`,
        ['prisma db push', '--force-reset', '--accept-data-loss'],
        {
          cwd: rwjsPaths.api.base,
          stdio: 'inherit',
          shell: true,
          env: { DATABASE_URL },
        }
      )
    }

    // **NOTE** There is no official way to run Jest programmatically,
    // so we're running it via execa, since `jest.run()` is a bit unstable.
    // https://github.com/facebook/jest/issues/5048
    await execa('yarn jest', jestArgs, {
      cwd: rwjsPaths.base,
      shell: true,
      stdio: 'inherit',
      env: { DATABASE_URL },
    })
  } catch (e) {
    // Errors already shown from execa inherited stderr
    process.exit(e?.exitCode || 1)
  }
}
