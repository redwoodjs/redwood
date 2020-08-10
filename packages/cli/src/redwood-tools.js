#!/usr/bin/env node
import path from 'path'
import fs from 'fs'

import yargs from 'yargs'
import { getPaths, ensurePosixPath } from '@redwoodjs/internal'
import execa from 'execa'
import chokidar from 'chokidar'
import _ from 'lodash'

const RW_BINS = {
  redwood: 'cli/dist/index.js',
  rw: 'cli/dist/index.js',
  'redwood-tools': 'cli/dist/redwood-tools.js',
  rwt: 'cli/dist/redwood-tools.js',
  'dev-server': 'dev-server/dist/main.js',
}

export const resolveFrameworkPath = (RW_PATH) => {
  if (!fs.existsSync(RW_PATH)) {
    console.error(`Error: '${RW_PATH}' does not exist`)
    process.exit(1)
  }
  return path.resolve(process.cwd(), RW_PATH)
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

      try {
        fs.chmodSync(from, '755')
      } catch (e) {
        console.error(`Warning: Could not chmod ${from}`)
        console.error(e)
      }
    })
}

export const copyFiles = async (src, dest) => {
  // TODO: Figure out if we need to only run based on certain events.

  src = ensurePosixPath(src)
  dest = ensurePosixPath(dest)

  await execa('rsync', ['-rtvu --delete', `'${src}'`, `'${dest}'`], {
    shell: true,
    stdio: 'inherit',
    cleanup: true,
  })
  // when rsync is run modify the permission to make binaries executable.
  fixProjectBinaries(getPaths().base)
}

// eslint-disable-next-line no-unused-expressions
yargs
  .command(
    ['copy [RW_PATH]', 'cp'],
    'Copy the Redwood Framework path to this project',
    {},
    ({ RW_PATH = process.env.RW_PATH }) => {
      RW_PATH = resolveFrameworkPath(RW_PATH)

      console.log('Redwood Framework Path: ', RW_PATH)

      const src = `${RW_PATH}/packages/`
      const dest = `${getPaths().base}/node_modules/@redwoodjs/` // eslint-disable-line

      copyFiles(src, dest)
    }
  )
  .command(
    ['copy:watch [RW_PATH]', 'cpw'],
    'Watch the Redwood Framework path for changes and copy them over to this project',
    {},
    ({ RW_PATH = process.env.RW_PATH }) => {
      RW_PATH = resolveFrameworkPath(RW_PATH)

      console.log('Redwood Framework Path: ', RW_PATH)

      const src = `${RW_PATH}/packages/`
      const dest = `${getPaths().base}/node_modules/@redwoodjs/`

      chokidar
        .watch(src, {
          persistent: true,
          recursive: true,
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
  )
  .command(
    ['install [packageName]', 'i'],
    'Install a package from your local NPM registry',
    () => {},
    ({ packageName }) => {
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
