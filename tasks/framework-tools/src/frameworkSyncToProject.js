#!/usr/bin/env node
/* eslint-env node, es6 */

/**
 * - add the deps and install
 * - build and copy over files
 * - remove them when user cancels
 */

const chokidar = require('chokidar')
const execa = require('execa')

// add the deps and install

const addFrameworkDepsToProject = () => {
  try {
    execa.sync('yarn project:deps', {
      shell: true,
      stdio: 'inherit',
      env: {
        RWJS_CWD: process.env.RWJS_CWD,
      },
    })
  } catch (e) {
    console.error(
      'Error: Could not add Redwood Framework dependencies to project'
    )
    console.error(e)
    process.exit(1)
  }
}

const runYarnInstall = () => {
  try {
    execa.sync('yarn install', {
      cwd: process.env.RWJS_CWD,
      shell: true,
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('Error: Could not run `yarn install`')
    console.error(e)
    process.exit(1)
  }
}

// build and copy over files

const buildRedwoodFramework = () => {
  try {
    execa.sync('yarn build:clean && yarn build:js', {
      shell: true,
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('Error: Could not build Redwood Framework')
    console.error(e)
    process.exit(1)
  }
}

const copyFrameworkPackages = () => {
  try {
    execa.sync('yarn project:copy', {
      shell: true,
      stdio: 'inherit',
      env: {
        RWJS_CWD: process.env.RWJS_CWD,
      },
    })
  } catch (e) {
    console.error('Error: We could not copy Redwood Framework packages')
    console.error(e)
    process.exit(1)
  }
}

//

try {
  addFrameworkDepsToProject()
  runYarnInstall()
  buildRedwoodFramework()
  copyFrameworkPackages()
} catch (e) {
  console.log()
}

// TODO we might be able to get close to pattern matching by doing...
//
// chokidar
//   .watch(frameworkFiles, options)
//   .on('change', (path) => {
//     switch (true) {
//       case depsChanged(path):
//         ...
//       case frameworkChanged(path):
//         ...
//       default:
//         ...
//     }
//   })
