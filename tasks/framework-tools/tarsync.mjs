#!/usr/bin/env node

import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { parseArgs as nodeUtilParseArgs } from 'node:util'

import ora from 'ora'
import { cd, chalk, fs, glob, path, within, $ } from 'zx'

const FRAMEWORK_PATH = fileURLToPath(new URL('../../', import.meta.url))
const TARBALL_DEST_DIRNAME = 'tarballs'

async function main() {
  const { projectPath, verbose } = await getOptions()
  $.verbose = verbose

  cd(FRAMEWORK_PATH)
  performance.mark('startFramework')

  const spinner = getFrameworkSpinner({ text: 'building and packing packages' })
  await buildTarballs()

  spinner.text = 'moving tarballs'
  await moveTarballs(projectPath)

  spinner.text = 'updating resolutions'
  await updateResolutions(projectPath)

  performance.mark('endFramework')
  performance.measure('framework', 'startFramework', 'endFramework')
  const [entry] = performance.getEntriesByName('framework')
  spinner.succeed(`finished in ${(entry.duration / 1000).toFixed(2)} seconds`)

  await yarnInstall(projectPath)

  const entries = performance.getEntriesByType('measure').map((entry) => {
    return `• ${entry.name} => ${(entry.duration / 1000).toFixed(2)} seconds`
  })

  for (const entry of entries) {
    verbose && console.log(entry)
  }
}

main()

// Helpers
// -------

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
      ].join('\n'),
    )
  }

  // This makes `projectPath` an absolute path and throws if it doesn't exist.
  options.projectPath = await fs.realpath(options.projectPath)

  return options
}

async function getOptions() {
  let options

  try {
    options = await parseArgs()
  } catch (e) {
    console.error(e.message)
    process.exitCode = 1
    return
  }

  const { projectPath, verbose } = options

  return {
    projectPath,
    verbose,
  }
}

const mockSpinner = {
  text: '',
  succeed: () => {},
}

function getProjectSpinner({ text }) {
  return $.verbose
    ? mockSpinner
    : ora({ prefixText: `${chalk.green('[ project ]')}`, text }).start()
}

function getFrameworkSpinner({ text }) {
  return $.verbose
    ? mockSpinner
    : ora({ prefixText: `${chalk.cyan('[framework]')}`, text }).start()
}

async function buildTarballs() {
  await $`yarn nx run-many -t build:pack --exclude create-redwood-app`
}

async function moveTarballs(projectPath) {
  const tarballDest = path.join(projectPath, TARBALL_DEST_DIRNAME)
  await fs.ensureDir(tarballDest)

  const tarballs = await glob(['./packages/**/*.tgz'])

  await Promise.all(
    tarballs.map((tarball) =>
      fs.move(tarball, path.join(tarballDest, path.basename(tarball)), {
        overwrite: true,
      }),
    ),
  )
}

async function getReactResolutions() {
  const packageConfig = await fs.readJson(
    path.join(FRAMEWORK_PATH, 'packages/web/package.json'),
  )

  const react = packageConfig.peerDependencies.react
  const reactDom = packageConfig.peerDependencies['react-dom']

  if (!react || !reactDom) {
    throw new Error(
      "Couldn't find react or react-dom in @redwoodjs/web's peerDependencies",
    )
  }

  return {
    react,
    'react-dom': reactDom,
  }
}

async function updateResolutions(projectPath) {
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
        [name]: `./${TARBALL_DEST_DIRNAME}/${
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
      resolutions: {
        ...projectPackageJson.resolutions,
        ...resolutions,
        ...(await getReactResolutions()),
      },
    },
    {
      spaces: 2,
    },
  )
}

async function yarnInstall(projectPath) {
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
}
