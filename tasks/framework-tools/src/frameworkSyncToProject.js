#!/usr/bin/env node
/* eslint-env node, es6 */

/**
 * - add the deps and install
 * - build and copy over files
 * - remove them when user cancels
 */

const fs = require('fs')
const path = require('path')

const c = require('ansi-colors')
const chokidar = require('chokidar')
const execa = require('execa')
const rimraf = require('rimraf')
const terminalLink = require('terminal-link')

const {
  gatherDeps,
  getPackageJson,
  REDWOOD_PACKAGES_PATH,
  redwoodPackages,
  packagesFileList,
  redwoodBins,
} = require('./utils')

const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD

if (!projectPath) {
  console.log('Error: Please specify the path to your Redwood Project')
  console.log(`Usage: ${process.argv?.[1]} /path/to/rwjs/proect`)
  process.exit(1)
}

const REDWOOD_PROJECT_NODE_MODULES = path.join(projectPath, 'node_modules')

const { packageJson, packageJsonLink, writePackageJson } =
  getPackageJson(projectPath)

let { dependencies, warnings } = gatherDeps()

chokidar
  .watch(REDWOOD_PACKAGES_PATH, {
    ignored: [
      '**/create-redwood-app/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.vscode',
      '**/*.md',
      '**/__fixtures__/**',
      '**/fixtures/**',
      '**/*.test.{js,ts}',
      '**/{__tests__}/**',
      '**/__mocks__/**',
      '**/jest.{config,setup}.{js,ts}',
    ],
  })
  .on('ready', () => {
    if (warnings.length) {
      for (const [packageName, message] of warnings) {
        console.warn('Warning:', packageName, message)
      }
      console.log()
    }

    console.log(
      `Adding ${
        Object.keys(dependencies).length
      } Framework dependencies to ${packageJsonLink}...`
    )

    if (packageJson.dependencies) {
      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...dependencies,
      }
    } else {
      packageJson.dependencies = dependencies
    }

    writePackageJson(packageJson)

    try {
      execa.sync('yarn install', {
        cwd: projectPath,
        shell: true,
        stdio: 'inherit',
      })
    } catch (e) {
      console.error('Error: Could not run `yarn install`')
      console.error(e)
      process.exit(1)
    }

    // copy over the files

    rimraf.sync(path.join(REDWOOD_PROJECT_NODE_MODULES, '@redwoodjs'))

    console.log('Copying...')
    console.log()

    const packages = packagesFileList()

    for (const [packageName, files] of Object.entries(packages)) {
      console.log(
        terminalLink(
          packageName,
          'file://' + path.join(REDWOOD_PROJECT_NODE_MODULES, packageName)
        ),
        files.length,
        'files'
      )
      for (const file of files) {
        const src = path.join(
          REDWOOD_PACKAGES_PATH,
          packageName.replace('@redwoodjs', ''),
          file
        )
        const dst = path.join(REDWOOD_PROJECT_NODE_MODULES, packageName, file)
        fs.mkdirSync(path.dirname(dst), { recursive: true })
        fs.copyFileSync(src, dst)
      }
    }
    console.log()

    const bins = redwoodBins()
    for (let [binName, binPath] of Object.entries(bins)) {
      // if the binPath doesn't exist, create it.
      const binSymlink = path.join(
        REDWOOD_PROJECT_NODE_MODULES,
        '.bin',
        binName
      )
      binPath = path.join(REDWOOD_PROJECT_NODE_MODULES, binPath)
      if (!fs.existsSync(binSymlink)) {
        fs.symlinkSync(binPath, binSymlink)
      }

      console.log('chmod +x', binName)
      fs.chmodSync(binPath, '755')
    }
    console.log()
  })
  .on('change', (file) => {
    console.log(c.dim(`[${file}`))

    if (redwoodPackages().includes(file)) {
      const newDeps = gatherDeps()

      if (
        JSON.stringify(dependencies) !== JSON.stringify(newDeps.dependencies)
      ) {
        console.log('Your dependencies have changed; run `yarn install`')
        console.log()

        dependencies = newDeps.dependencies
        warnings = newDeps.warnings

        if (warnings.length) {
          for (const [packageName, message] of warnings) {
            console.warn('Warning:', packageName, message)
          }
          console.log()
        }
      }
    } else {
      const packageDirs = redwoodPackages().map(path.dirname)
      const packageToRebuild = packageDirs.find((dir) => file.startsWith(dir))
      console.log(`Rebuilding ${packageToRebuild}`)
      console.log()

      execa.sync('yarn build', {
        cwd: packageToRebuild,
        shell: true,
        stdio: 'inherit',
      })

      console.log()

      // copy just this package's files
      // console.log(
      //   terminalLink(packageToRebuild, 'file://' + packageToRebuild),
      //   files.length,
      //   'files'
      // )
      //
      // const files = packagesFileList()[packageToRebuild]
      // for (const file of files) {
      //   const src = path.join(
      //     REDWOOD_PACKAGES_PATH,
      //     packageToRebuild.replace('@redwoodjs', ''),
      //     file
      //   )
      //   const dst = path.join(
      //     REDWOOD_PROJECT_NODE_MODULES,
      //     packageToRebuild,
      //     file
      //   )
      //   fs.mkdirSync(path.dirname(dst), { recursive: true })
      //   fs.copyFileSync(src, dst)
      // }
    }
  })
