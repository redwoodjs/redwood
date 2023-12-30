#!/usr/bin/env node
/* eslint-env node */

import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { parseArgs as nodeUtilParseArgs } from 'node:util'

import ora from 'ora'
import { cd, chalk, fs, glob, path, within, $ } from 'zx'

const mockSpinner = {
  text: '',
  succeed: () => {},
}

async function main() {
  let options

  try {
    options = await parseArgs()
  } catch (e) {
    console.error(e.message)
    process.exitCode = 1
    return
  }

  const { projectPath, verbose } = options

  $.verbose = verbose

  // Closing over `verbose` here.
  function getProjectSpinner({ text }) {
    return verbose
      ? mockSpinner
      : ora({ prefixText: `${chalk.green('[ project ]')}`, text }).start()
  }

  function getFrameworkSpinner({ text }) {
    return verbose
      ? mockSpinner
      : ora({ prefixText: `${chalk.cyan('[framework]')}`, text }).start()
  }

  const frameworkPath = fileURLToPath(new URL('../../', import.meta.url))
  cd(frameworkPath)
  performance.mark('startFramework')

  const spinner = getFrameworkSpinner({ text: 'building and packing packages' })

  await $`yarn nx run-many -t build:pack`

  spinner.text = 'moving tarballs'

  const tarballDestDirname = 'tarballs'
  const tarballDest = path.join(projectPath, tarballDestDirname)
  await fs.ensureDir(tarballDest)

  const tarballs = await glob(['./packages/**/*.tgz'])

  await Promise.all(
    tarballs.map((tarball) =>
      fs.move(tarball, path.join(tarballDest, path.basename(tarball)), {
        overwrite: true,
      })
    )
  )

  spinner.text = 'updating resolutions'

  const resolutions = (await $`yarn workspaces list --json`).stdout
    .trim()
    .split('\n')
    .map(JSON.parse)
    // Filter out the root workspace.
    .filter(({ name }) => name)
    .reduce((resolutions, { name }) => {
      return {
        ...resolutions,
        // Turn a Redwood package name like `@redwoodjs/project-config` into `redwoodjs-project-config.tgz`.
        [name]: `./${tarballDestDirname}/${
          name.replace('@', '').replaceAll('/', '-') + '.tgz'
        }`,
      }
    }, {})

  const projectPackageJsonPath = path.join(projectPath, 'package.json')
  const projectPackageJson = await fs.readJSON(projectPackageJsonPath)

  await fs.writeJSON(
    projectPackageJsonPath,
    {
      ...projectPackageJson,
      resolutions,
    },
    {
      spaces: 2,
    }
  )

  performance.mark('endFramework')
  performance.measure('framework', 'startFramework', 'endFramework')

  const [entry] = performance.getEntriesByName('framework')

  spinner.succeed(`finished in ${(entry.duration / 1000).toFixed(2)} seconds`)

  await within(async () => {
    cd(projectPath)
    performance.mark('startProject')

    const spinner = getProjectSpinner({ text: 'yarn install' })

    await $`yarn install`

    performance.mark('endProject')
    performance.measure('project', 'startProject', 'endProject')

    const [entry] = performance.getEntriesByName('project')

    spinner.succeed(`finished in ${(entry.duration / 1000).toFixed(2)} seconds`)
  })

  const entries = performance.getEntriesByType('measure').map((entry) => {
    return `• ${entry.name} => ${(entry.duration / 1000).toFixed(2)} seconds`
  })

  for (const entry of entries) {
    verbose && console.log(entry)
  }
}

main()

async function parseArgs() {
  const { positionals, values } = nodeUtilParseArgs({
    allowPositionals: true,

    options: {
      verbose: {
        type: 'boolean',
        default: false,
        short: 'v',
      },
    },
  })

  const [projectPath] = positionals

  const options = {
    verbose: values.verbose,
  }

  options.projectPath = projectPath ? projectPath : process.env.RWJS_CWD

  if (!options.projectPath) {
    throw new Error(
      [
        'Error: You have to provide the path to a Redwood project as',
        '',
        '  1. the first positional argument',
        '',
        chalk.gray('  yarn project:tarsync /path/to/redwood/project'),
        '',
        '  2. the `RWJS_CWD` env var',
        '',
        chalk.gray('  RWJS_CWD=/path/to/redwood/project yarn project:tarsync'),
      ].join('\n')
    )
  }

  // This makes `projectPath` an absolute path and throws if it doesn't exist.
  options.projectPath = await fs.realpath(options.projectPath)

  return options
}
