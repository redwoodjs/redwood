import fs from 'fs'
import os from 'os'
import path from 'path'

import execa from 'execa'

const testTutorial = async () => {
  // First two args are "node" and path to script
  const [, , pathToProject] = process.argv

  let projectPath = pathToProject
  const frameworkPath = path.join(__dirname, '..')
  const e2ePath = path.join(frameworkPath, 'tasks/e2e')

  if (process.env.DEBUG) {
    console.log(`📁 ~ file: test-tutorial.js ~ projectPath`, projectPath)
    console.log(`🌲 ~ file: test-tutorial.js ~ frameworkPath`, frameworkPath)
    console.log(`🚀 ~ file: test-tutorial.js ~ e2ePath`, e2ePath)
  }

  await execa('yarn install', {
    cwd: e2ePath,
    shell: true,
    stdio: 'inherit',
  })

  if (pathToProject) {
    console.log(
      `\n 🗂️  You have supplied a path ${projectPath}, we will not create a new `
    )
    console.log('Redwood project, we will use the app you have specified.')
  } else {
    console.log('\n ℹ️  You have not supplied a path to a Redwood project.')
    console.log('We will create one for you. \n \n')
    console.log(
      "📋 We will copy './packages/create-redwood-app/template' and link packages/* \n"
    )

    // Use temporary project path, because no user supplied one
    projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'redwood-e2e-'))

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

  // Clean and build framework
  await execa('yarn build:clean && yarn lerna run build:js', {
    cwd: frameworkPath,
    shell: true,
    stdio: 'inherit',
  })

  const packagesPath = path.join(frameworkPath, 'packages')

  // Link packages from framework
  await execa(`ln -s ${packagesPath} ./packages`, {
    shell: true,
    stdio: 'inherit',
    cwd: projectPath,
  })

  await execa('yarn install', {
    shell: true,
    stdio: 'inherit',
    cwd: projectPath,
  })

  await execa('yarn rw dev --fwd="--open=false" &', {
    shell: true,
    stdio: 'inherit',
    cwd: projectPath,
  })

  // @Note: using env to set RW_PATH does not work correctly
  if (process.env.CI) {
    console.log('\n ⏩ Skipping cypress open, handled by github workflow')
    // @TODO should we just use yarn cypress run?
  } else {
    await execa('yarn cypress', ['open', `--env RW_PATH=${projectPath}`], {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
      },
      cwd: e2ePath,
    })
  }
}

testTutorial()
