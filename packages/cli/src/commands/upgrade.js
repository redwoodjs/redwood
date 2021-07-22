import fs from 'fs'
import path from 'path'

import execa from 'execa'
import latestVersion from 'latest-version'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { generatePrismaClient } from '../lib/generatePrismaClient'

export const command = 'upgrade'
export const description = 'Upgrade all @redwoodjs packages via interactive CLI'

export const builder = (yargs) => {
  yargs
    .example(
      'rw upgrade -t 0.20.1-canary.5',
      'Specify a version. URL for Version History:\nhttps://www.npmjs.com/package/@redwoodjs/core'
    )
    .option('dry-run', {
      alias: 'd',
      description: 'Check for outdated packages without upgrading',
      type: 'boolean',
    })
    .option('tag', {
      alias: 't',
      description:
        '[choices: "canary", "rc", or specific-version (see example below)] WARNING: "canary" and "rc" tags are unstable releases!',
      requiresArg: true,
      type: 'string',
      coerce: validateTag,
    })
    .option('verbose', {
      alias: 'v',
      description: 'Print verbose logs',
      type: 'boolean',
      default: false,
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#upgrade'
      )}`
    )
    // Just to make an empty line
    .epilogue('')
    .epilogue(
      `We are < v1.0.0, so breaking changes occur frequently. For more information on the current release, see the ${terminalLink(
        'release page',
        'https://github.com/redwoodjs/redwood/releases'
      )}`
    )
}

// Used in yargs builder to coerce tag
const SEMVER_REGEX =
  /(?<=^v?|\sv?)(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/gi
const validateTag = (tag) => {
  const isTagValid =
    tag === 'rc' ||
    tag === 'canary' ||
    tag === 'latest' ||
    SEMVER_REGEX.test(tag)

  if (!isTagValid) {
    // Stop execution
    throw new Error(
      c.error(
        'Invalid tag supplied. Supported values: rc, canary, latest, or valid semver version\n'
      )
    )
  }

  return tag
}

export const handler = async ({ dryRun, tag, verbose }) => {
  // structuring as nested tasks to avoid bug with task.title causing duplicates
  const tasks = new Listr(
    [
      {
        title: 'Checking latest version',
        task: async (ctx) => setLatestVersionToContext(ctx, tag),
      },
      {
        title: 'Updating your project package.json(s)',
        task: (ctx) => updateRedwoodDepsForAllSides(ctx, { dryRun, verbose }),
        enabled: (ctx) => !!ctx.versionToUpgradeTo,
      },
      {
        title: 'Running yarn install',
        task: (ctx) => yarnInstall(ctx, { dryRun, verbose }),
        skip: () => dryRun,
      },
      {
        title: 'Refreshing the Prisma client',
        task: (_ctx, task) => refreshPrismaClient(task, { verbose }),
        skip: () => dryRun,
      },
      {
        title: 'One more thing..',
        task: (ctx, task) => {
          const version = ctx.versionToUpgradeTo
          task.title =
            `One more thing...\n\n   ${c.warning(
              `🎉 Your project has been upgraded to RedwoodJS ${version}!`
            )} \n\n` +
            `   Please review the release notes for any manual steps: \n   ❖ ${terminalLink(
              `Redwood community discussion`,
              `https://community.redwoodjs.com/search?q=${version}%23announcements`
            )}\n   ❖ ${terminalLink(
              `GitHub Release notes`,
              `https://github.com/redwoodjs/redwood/releases` // intentionally not linking to specific version
            )}
          `
        },
      },
    ],
    { collapse: false, renderer: verbose && VerboseRenderer }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
async function yarnInstall({ verbose }) {
  try {
    await execa('yarn install', ['--force', '--non-interactive'], {
      shell: true,
      stdio: verbose ? 'inherit' : 'pipe',

      cwd: getPaths().base,
    })
  } catch (e) {
    throw new Error(
      'Could not finish installation. Please run `yarn install --force`, before continuing'
    )
  }
}

async function setLatestVersionToContext(ctx, tag) {
  try {
    const foundVersion = await latestVersion(
      '@redwoodjs/core',
      tag ? { version: tag } : {}
    )

    ctx.versionToUpgradeTo = foundVersion
    return foundVersion
  } catch (e) {
    throw new Error('Could not find the latest version')
  }
}

/**
 * Iterates over Redwood dependencies in package.json files and updates the version.
 */
function updatePackageJsonVersion(pkgPath, version, { dryRun, verbose }) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf-8')
  )

  if (pkg.dependencies) {
    for (const depName of Object.keys(pkg.dependencies).filter((x) =>
      x.startsWith('@redwoodjs/')
    )) {
      if (verbose || dryRun) {
        console.log(
          ` - ${depName}: ${pkg.dependencies[depName]} => ^${version}`
        )
      }
      pkg.dependencies[depName] = `^${version}`
    }
  }
  if (pkg.devDependencies) {
    for (const depName of Object.keys(pkg.devDependencies).filter((x) =>
      x.startsWith('@redwoodjs/')
    )) {
      if (verbose || dryRun) {
        console.log(
          ` - ${depName}: ${pkg.devDependencies[depName]} => ^${version}`
        )
      }
      pkg.devDependencies[depName] = `^${version}`
    }
  }

  if (!dryRun) {
    fs.writeFileSync(
      path.join(pkgPath, 'package.json'),
      JSON.stringify(pkg, undefined, 2)
    )
  }
}

function updateRedwoodDepsForAllSides(ctx, options) {
  if (!ctx.versionToUpgradeTo) {
    throw new Error('Failed to upgrade')
  }

  const updatePaths = [
    getPaths().base,
    getPaths().api.base,
    getPaths().web.base,
  ]

  return new Listr(
    updatePaths.map((basePath) => {
      const pkgJsonPath = path.join(basePath, 'package.json')
      return {
        title: `Updating ${pkgJsonPath}`,
        task: () =>
          updatePackageJsonVersion(basePath, ctx.versionToUpgradeTo, options),
        skip: () => !fs.existsSync(pkgJsonPath),
      }
    })
  )
}

async function refreshPrismaClient(task, { verbose }) {
  /** Relates to prisma/client issue, @see: https://github.com/redwoodjs/redwood/issues/1083 */
  try {
    await generatePrismaClient({
      verbose,
      force: false,
      schema: getPaths().api.dbSchema,
    })
  } catch (e) {
    task.skip('Refreshing the Prisma client caused an Error.')
    console.log(
      'You may need to update your prisma client manually: $ yarn rw prisma generate'
    )
    console.log(c.error(e.message))
  }
}
