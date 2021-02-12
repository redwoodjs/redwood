#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

import chokidar from 'chokidar'
import execa from 'execa'
import _ from 'lodash'
import prettier from 'prettier'
import prompts from 'prompts'
import yargs from 'yargs'

import { getPaths, ensurePosixPath } from '@redwoodjs/internal'

import c from './lib/colors'

const RW_BINS = {
  redwood: 'cli/dist/index.js',
  rw: 'cli/dist/index.js',
  'redwood-tools': 'cli/dist/redwood-tools.js',
  rwt: 'cli/dist/redwood-tools.js',
  'dev-server': 'dev-server/dist/main.js',
  'api-server': 'api-server/dist/index.js',
}

export const resolveFrameworkPath = (RW_PATH) => {
  if (!fs.existsSync(RW_PATH)) {
    console.error(`Error: '${RW_PATH}' does not exist`)
    process.exit(1)
  }
  return path.resolve(process.cwd(), RW_PATH)
}

export const fixBinaryPermissions = (PROJECT_PATH) => {
  Object.keys(RW_BINS)
    .map((name) => {
      return path.join(PROJECT_PATH, 'node_modules/.bin/', name)
    })
    .forEach((binFile) => {
      try {
        fs.chmodSync(binFile, '755')
      } catch (e) {
        console.warn(`Warning: Could not chmod ${binFile}`)
        console.log(e)
      }
    })
}

export const fixProjectBinaries = (PROJECT_PATH) => {
  Object.keys(RW_BINS)
    .map((name) => {
      const from = path.join(PROJECT_PATH, 'node_modules/.bin/', name)
      const to = path.join(
        PROJECT_PATH,
        'node_modules/@redwoodjs',
        RW_BINS[name]
      )
      console.log(`symlink '${from}' -> '${to}'`)
      return [from, to]
    })
    .forEach(([from, to]) => {
      try {
        fs.unlinkSync(from)
      } catch (e) {
        console.warn(`Warning: Could not unlink ${from}`)
      }
      try {
        fs.symlinkSync(to, from)
      } catch (e) {
        console.warn(`Warning: Could not symlink ${from} -> ${to}`)
        console.log(e)
      }
      try {
        fs.chmodSync(from, '755')
      } catch (e) {
        console.warn(`Warning: Could not chmod ${from}`)
        console.log(e)
      }
    })
}

export const copyFiles = async (src, dest) => {
  // TODO: Figure out if we need to only run based on certain events.

  src = ensurePosixPath(src)
  dest = ensurePosixPath(dest)

  await execa(
    'rsync',
    [
      `-rtvu --delete --exclude "create-redwood-app/template"`,
      `'${src}'`,
      `'${dest}'`,
    ],
    {
      shell: true,
      stdio: 'inherit',
      cleanup: true,
    }
  )
  // when rsync is run modify the permission to make binaries executable.
  fixProjectBinaries(getPaths().base)
}

const rwtCopy = ({ RW_PATH = process.env.RW_PATH }) => {
  RW_PATH = resolveFrameworkPath(RW_PATH)

  console.log(`Redwood Framework Path: ${c.info(RW_PATH)}`)

  const src = `${RW_PATH}/packages/`
  const dest = `${getPaths().base}/node_modules/@redwoodjs/` // eslint-disable-line

  copyFiles(src, dest)
}

const rwtCopyWatch = ({ RW_PATH = process.env.RW_PATH }) => {
  RW_PATH = resolveFrameworkPath(RW_PATH)

  console.log(`Redwood Framework Path: ${c.info(RW_PATH)}`)

  const src = `${RW_PATH}/packages/`
  const dest = `${getPaths().base}/node_modules/@redwoodjs/`

  chokidar
    .watch(src, {
      persistent: true,
      recursive: true,
      ignored: [path.join(src, 'packages/create-redwood-app/template')],
    })
    .on(
      'all',
      _.debounce((event) => {
        // TODO: Figure out if we need to only run based on certain events.
        console.log('Trigger event: ', event)
        copyFiles(src, dest)
      }, 500)
    )
}

const rwtContrib = async ({ RW_PATH = process.env.RW_PATH }) => {
  RW_PATH = resolveFrameworkPath(RW_PATH)
  console.log(`Redwood Framework Path: ${c.info(RW_PATH)}`)

  // Check if /redwood included in workspaces
  const pkgJSONPath = path.join(getPaths().base, 'package.json')
  const packageJSON = require(pkgJSONPath)
  const isRedwoodInWorkspaces = packageJSON.workspaces?.packages.some(
    (workspacePath) => workspacePath.match(/redwood\/?\*?/)
  )

  if (!isRedwoodInWorkspaces) {
    console.log('You dont have redwood in your workspace package, dude')
    const { shouldAddWorkspacePath } = await prompts({
      type: 'confirm',
      name: 'shouldAddWorkspacePath',
      message:
        'Add redwood folder to your workspaces config? \n This will modify your package.json',
    })

    if (shouldAddWorkspacePath) {
      const updatedPackageJSON = {
        ...packageJSON,
        workspaces: {
          packages: [...packageJSON.workspaces.packages, 'redwood/*'],
        },
      }

      fs.writeFileSync(
        pkgJSONPath,
        prettier.format(JSON.stringify(updatedPackageJSON), {
          parser: 'json-stringify',
        })
      )

      console.log('🎉 Done! Workspaces now has redwood/')
    } else {
      console.log('Cancelling contributor workflow...')

      return
    }
  }

  const packagesPath = `${RW_PATH}/packages`
  console.log(`Linking your local Redwood build from ${c.info(packagesPath)}`)

  if (!fs.existsSync(path.join(getPaths().base, 'redwood'))) {
    await execa(`ln -s ${packagesPath} redwood`, {
      shell: true,
      stdio: 'inherit',
      cleanup: true,
    })

    // Let workspaces do the link
    await execa('yarn build', {
      shell: true,
      stdio: 'inherit',
      cleanup: true,
    })
  }

  fixBinaryPermissions(getPaths().base)

  console.log(
    ` 🚀 ${c.green('Go forth and contribute!')}` + '\n' + ' Building redwood...'
  )

  const src = `${RW_PATH}/packages/`

  chokidar
    .watch(src, {
      persistent: true,
      recursive: true,
      ignored: [path.join(src, 'packages/create-redwood-app/template')],
    })
    .on(
      'all',
      _.debounce(() => {
        execa('yarn build', {
          shell: true,
          stdio: 'inherit',
          cleanup: true,
          cwd: RW_PATH,
        })
        fixBinaryPermissions(getPaths().base)
      }, 500)
    )

  // const doSomeStuff = async () => {
  //   console.log('unwatch')
  //   await watchHandle.unwatch(packagesWithBins)
  //   fixBinaryPermissions(getPaths().base)
  //   console.log('Fixed perms')
  //   watchHandle.add(packagesWithBins)
  //   console.log('Added watch')
  // }
}

const rwtInstall = ({ packageName }) => {
  // This command upgrades a Redwood package from the local NPM registry. You
  // run the local registry from `./tasks/run-local-npm`.
  // See `CONTRIBUTING.md` for more information.
  const pkgPath = path.join(getPaths().base, 'node_modules', packageName)
  console.log(`Deleting ${pkgPath}`)
  try {
    fs.rmdirSync(pkgPath, { recursive: true })
  } catch (e) {
    console.error(`Error: Could not delete ${pkgPath}`)
    process.exit(1)
  }

  execa(
    'yarn',
    [
      'upgrade',
      `${packageName}@dev`,
      '--no-lockfile',
      '--registry http://localhost:4873/',
      '--check-files',
    ],
    {
      shell: true,
      cwd: getPaths().base,
      stdio: 'inherit',
      extendEnv: true,
      cleanup: true,
    }
  )
}

// eslint-disable-next-line no-unused-expressions
yargs
  .command(
    ['copy [RW_PATH]', 'cp'],
    'Copy the Redwood Framework path to this project',
    {},
    rwtCopy
  )
  .command(
    ['copy:watch [RW_PATH]', 'cpw'],
    'Watch the Redwood Framework path for changes and copy them over to this project',
    {},
    rwtCopyWatch
  )
  .command(
    ['contrib [RW_PATH]', 'contrib'],
    'Run your local version of redwood in this project',
    {},
    rwtContrib
  )
  .command(
    ['install [packageName]', 'i'],
    'Install a package from your local NPM registry',
    () => {},
    rwtInstall
  )
  .command(
    ['fix-bins', 'fix'],
    'Fix Redwood symlinks and permissions',
    {},
    () => {
      fixProjectBinaries(getPaths().base)
    }
  )
  .command('bazinga')
  .demandCommand()
  .strict().argv
