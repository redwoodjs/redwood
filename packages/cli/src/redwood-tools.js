#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import chokidar from 'chokidar'
import execa from 'execa'
import _ from 'lodash'
import prettier from 'prettier'
import prompts from 'prompts'
import rimraf from 'rimraf'
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

const rwtLink = async (yargs) => {
  const RW_PATH = yargs.RW_PATH || process.env.RW_PATH
  const { clean } = yargs

  if (!RW_PATH) {
    console.error(c.error('You must specify a path to your local redwood repo'))
    process.exit(1)
    return
  }

  const frameworkPath = resolveFrameworkPath(RW_PATH)

  console.log(`Redwood Framework Path: ${c.info(frameworkPath)}`)

  // Check if /redwood included in workspaces
  const pkgJSONPath = path.join(getPaths().base, 'package.json')
  const packageJSON = require(pkgJSONPath)
  const isRedwoodInWorkspaces = packageJSON.workspaces?.packages.some(
    (workspacePath) => workspacePath.match(/redwood\/?\*?/)
  )

  if (!isRedwoodInWorkspaces) {
    console.log(`You don't have redwood in your workspace package`)
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

  const packagesPath = path.join(frameworkPath, 'packages')

  console.log(`Linking your local Redwood build from ${c.info(packagesPath)}`)

  if (!fs.statSync('./redwood').isDirectory()) {
    await execa(`ln -sf ${packagesPath} ./redwood`, {
      shell: true,
      stdio: 'inherit',
      cwd: getPaths().base,
    })
  }


  // Let workspaces do the link
  await execa('yarn install', {
    shell: true,
    stdio: 'inherit',
    cleanup: true,
    cwd: getPaths().base,
  })

  fixBinaryPermissions(getPaths().base)

  const message = `
  ${c.bold('🚀  Go Forth and Contribute!')}\n
  🏗  Building your local redwood repo..\n
  Contributing doc: ${c.underline(
    'https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md'
  )}
  `
  console.log(
    boxen(message, {
      padding: { top: 0, bottom: 0, right: 1, left: 1 },
      margin: 1,
      borderColour: 'gray',
    })
  )

  if (clean) {
    await execa('yarn build:clean', {
      shell: true,
      stdio: 'inherit',
      cleanup: true,
      cwd: frameworkPath,
    })
  }

  execa('yarn build:watch', {
    shell: true,
    stdio: 'inherit',
    cleanup: true,
    cwd: frameworkPath,
  })
}

const rwtRestore = () => {
  const symLinkPath = path.join(getPaths().base, 'redwood')

  if (fs.existsSync(symLinkPath)) {
    rimraf.sync(symLinkPath)
  }

  execa('yarn install', {
    shell: true,
    stdio: 'inherit',
    cleanup: true,
    cwd: getPaths().base,
  })
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
  .command({
    command: 'link [RW_PATH]',
    aliases: ['c'],
    builder: (yargs) => {
      return yargs.option('clean', {
        alias: 'c',
        type: 'boolean',
        description: 'Clean the redwood dist folders first.',
        default: true,
      })
    },
    desc: 'Run your local version of redwood in this project',
    handler: rwtLink,
  })
  .command({
    command: 'restore',
    desc:
      'Unlink your local verison of redwood, and use the one specified in package.json',
    handler: rwtRestore,
  })
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
  .demandCommand()
  .strict().argv
