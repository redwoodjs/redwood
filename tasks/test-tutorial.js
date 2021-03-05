/* eslint-env node, es6*/

import fs from 'fs'
import os from 'os'
import path from 'path'

import execa from 'execa'
import rimraf from 'rimraf'

const createNewRedwoodProject = async (projectPath, frameworkPath) => {
  console.log(
    '------------------------ start create redwood app -------------------------'
  )
  await execa(
    'yarn babel-node',
    ['src/create-redwood-app.js', projectPath, '--no-yarn-install'],
    {
      cwd: path.join(frameworkPath, 'packages/create-redwood-app'),
      shell: true,
      stdio: 'inherit',
    }
  )
}

const testTutorial = async () => {
  // First two args are "node" and path to script
  const [, , pathToProject] = process.argv

  let projectPath = pathToProject
  const frameworkPath = path.join(__dirname, '..')
  const e2ePath = path.join(frameworkPath, 'tasks/e2e')
  const shouldCreateNewProject = process.env.CREATE_RWJS_PROJECT === '1'

  console.log(`📁 ~ projectPath`, projectPath)
  console.log(`🌲 ~ frameworkPath`, frameworkPath)
  console.log(`🚀 ~ e2ePath`, e2ePath)

  try {
    await execa('yarn install', {
      cwd: e2ePath,
      shell: true,
      stdio: 'inherit',
    })

    if (pathToProject) {
      console.log('🗂️  You have supplied the path "${projectPath}" \n')

      // For e2e tests in CI
      if (shouldCreateNewProject) {
        createNewRedwoodProject(projectPath, frameworkPath)
      } else {
        // Normally when a path is specified, no need to create a new project
        console.log(
          [
            'Assuming pre-existing Redwood project',
            'Not creating a new one',
          ].join('\n')
        )
      }
    } else {
      console.log('\n ℹ️  You have not supplied a path to a Redwood project.')
      console.log('We will create one for you. \n \n')
      console.log(
        "📋 We will copy './packages/create-redwood-app/template' and link packages/* \n"
      )

      // Use temporary project path, because no user supplied one
      projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'redwood-e2e-'))

      createNewRedwoodProject(projectPath, frameworkPath)
    }

    const packagesPath = path.join(frameworkPath, 'packages')
    const symlinkPath = path.join(projectPath, 'packages')

    // Clean, Build, and Link packages from framework, but only if creating a new one
    if (!pathToProject || shouldCreateNewProject) {
      await execa('yarn build:clean && yarn lerna run build:js', {
        cwd: frameworkPath,
        shell: true,
        stdio: 'inherit',
      })

      if (
        fs.existsSync(symlinkPath) &&
        fs.lstatSync(symlinkPath).isSymbolicLink()
      ) {
        console.log('⚠️  Removing old symlink. Will recreate a new one')
        rimraf.sync(symlinkPath)
      }

      fs.symlinkSync(packagesPath, symlinkPath)
    }

    await execa('yarn install', {
      shell: true,
      stdio: 'inherit',
      cwd: projectPath,
    })

    // Make sure rw dev can run
    fs.chmodSync(path.join(projectPath, 'node_modules/.bin/rw'), '755')

    if (process.env.CI) {
      console.log(
        '\n ⏩ Skipping cypress and dev server launch, handled by github workflow'
      )
    } else {
      await execa('yarn rw dev --fwd="--open=false" &', {
        shell: true,
        stdio: 'inherit',
        cwd: projectPath,
      })

      // @Note: using env to set RW_PATH does not work correctly
      await execa('yarn cypress', ['open', `--env RW_PATH=${projectPath}`], {
        shell: true,
        stdio: 'inherit',
        env: {
          ...process.env,
        },
        cwd: e2ePath,
      })
    }
  } catch (e) {
    console.error('🛑 test-tutorial script failed')
    console.error(e)
    process.exit(1)
  }
}

testTutorial()
