#!/usr/bin/env node
/* eslint-env node, es6*/
//@ts-check
const fs = require('fs')
const os = require('os')
const path = require('path')

const chalk = require('chalk')
const fse = require('fs-extra')
const { rimraf } = require('rimraf')
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')

const {
  RedwoodTUI,
  ReactiveTUIContent,
  RedwoodStyling,
} = require('@redwoodjs/tui')

const {
  addFrameworkDepsToProject,
  copyFrameworkPackages,
} = require('./frameworkLinking')
const { webTasks, apiTasks } = require('./tui-tasks')
const { isAwaitable } = require('./typing')
const {
  getExecaOptions: utilGetExecaOptions,
  updatePkgJsonScripts,
  ExecaError,
  exec,
} = require('./util')

const args = yargs(hideBin(process.argv))
  .usage('Usage: $0 [option]')
  .option('verbose', {
    default: false,
    type: 'boolean',
    describe: 'Verbose output',
  })
  .option('resume', {
    default: false,
    type: 'boolean',
    describe: 'Resume rebuild of the latest unfinished test-project',
  })
  .option('resumePath', {
    type: 'string',
    describe: 'Resume rebuild given the specified test-project path',
  })
  .option('resumeStep', {
    type: 'number',
    describe: 'Resume rebuild from the given step',
  })
  .help()
  .parseSync()

const { verbose, resume, resumePath, resumeStep } = args

const OUTPUT_PROJECT_PATH = resumePath
  ? /* path.resolve(String(resumePath)) */ resumePath
  : path.join(
      os.tmpdir(),
      'redwood-test-project',
      // ":" is problematic with paths
      new Date().toISOString().split(':').join('-')
    )

const RW_FRAMEWORKPATH = path.join(__dirname, '../../')

const tui = new RedwoodTUI()

/** @type {(string) => import('execa').Options} */
function getExecaOptions(cwd) {
  return { ...utilGetExecaOptions(cwd), stdio: 'pipe' }
}

/**
 * @param {number} step
 */
function beginStep(step) {
  fs.mkdirSync(OUTPUT_PROJECT_PATH, { recursive: true })
  fs.writeFileSync(path.join(OUTPUT_PROJECT_PATH, 'step.txt'), '' + step)
}

/**
 * @param {import('./typing').TuiTaskDef} taskDef
 */
async function tuiTask({ step, title, content, skip: skipFn, task, parent }) {
  const stepId = (parent ? parent + '.' : '') + step

  const tuiContent = new ReactiveTUIContent({
    mode: 'text',
    header: `${stepId}: ${title}`,
    content,
    spinner: {
      enabled: true,
    },
  })

  tui.startReactive(tuiContent)

  // In the future you should be able to resume from subtasks too, but for now
  // we only support main level tasks
  if (!parent) {
    beginStep(step)
  }

  let skip = skipFn?.()

  if (skip) {
    if (typeof skip === 'boolean' && skip) {
      // if skip is just `true`, then we use the default skip message
      skip = 'Skipping...'
    }

    tuiContent.update({
      spinner: {
        enabled: false,
      },
      header: `${RedwoodStyling.green('✔')} ${step}. ${title}`,
      content: ' '.repeat(stepId.length + 4) + RedwoodStyling.info(skip) + '\n',
    })

    tui.stopReactive()

    return
  }

  let promise

  try {
    promise = task()
  } catch (e) {
    // This code handles errors from synchronous tasks

    tui.stopReactive(true)

    if (e instanceof ExecaError) {
      tui.displayError(
        'Failed ' + title.toLowerCase().replace('...', ''),
        'stdout:\n' + e.stdout + '\n\n' + 'stderr:\n' + e.stderr
      )
    } else {
      tui.displayError(
        'Failed ' + title.toLowerCase().replace('...', ''),
        e.message
      )
    }

    process.exit(e.exitCode)
  }

  if (isAwaitable(promise)) {
    const result = await promise.catch((e) => {
      // This code handles errors from asynchronous tasks

      tui.stopReactive(true)

      if (e instanceof ExecaError) {
        tui.displayError(
          'Failed ' + title.toLowerCase().replace('...', ''),
          'stdout:\n' + e.stdout + '\n\n' + 'stderr:\n' + e.stderr
        )
      } else {
        tui.displayError(
          'Failed ' + title.toLowerCase().replace('...', ''),
          e.message
        )
      }

      process.exit(e.exitCode)
    })

    if (Array.isArray(result)) {
      const tuiTaskList = result
      for (let i = 0; i < tuiTaskList.length; i++) {
        // Recurse through all tasks
        await tuiTask({
          step: i,
          ...tuiTaskList[i],
          parent: stepId,
        })
      }
    }
  }

  tuiContent.update({
    spinner: {
      enabled: false,
    },
    header: `${RedwoodStyling.green('✔')} ${stepId}: ${title}`,
    content: '',
  })

  tui.stopReactive()
}

/**
 * @param {number} startStep
 * @param {number} step
 */
function skipStep(startStep, step) {
  return () => {
    if (startStep > step) {
      return 'Skipping... Resuming from step ' + startStep
    }

    return false
  }
}

if (resume) {
  console.error(
    chalk.red.bold(
      '\n`resume` option is not supported yet. ' +
        'Please use `resumePath` instead.\n'
    )
  )

  process.exit(1)
}

if (resumePath && !fs.existsSync(path.join(resumePath, 'redwood.toml'))) {
  console.error(
    chalk.red.bold(
      `
      No redwood.toml file found at the given path: ${resumePath}
      `
    )
  )
  process.exit(1)
}

const createProject = () => {
  let cmd = `yarn node ./packages/create-redwood-app/dist/create-redwood-app.js ${OUTPUT_PROJECT_PATH}`

  const subprocess = exec(
    cmd,
    // We create a ts project and convert using ts-to-js at the end if typescript flag is false
    ['--no-yarn-install', '--typescript', '--overwrite', '--no-git'],
    getExecaOptions(RW_FRAMEWORKPATH)
  )

  return subprocess
}

const copyProject = async () => {
  const FIXTURE_TESTPROJ_PATH = path.join(
    RW_FRAMEWORKPATH,
    '__fixtures__/test-project'
  )

  // remove existing Fixture
  await rimraf(FIXTURE_TESTPROJ_PATH)
  // copy from tempDir to Fixture dir
  await fse.copy(OUTPUT_PROJECT_PATH, FIXTURE_TESTPROJ_PATH)
  // cleanup after ourselves
  await rimraf(OUTPUT_PROJECT_PATH)
}

let startStep = resumeStep || 0

if (!startStep) {
  // Figure out what step to restart the rebuild from
  try {
    const stepTxtNumber = parseInt(
      fs.readFileSync(path.join(OUTPUT_PROJECT_PATH, 'step.txt'), 'utf-8'),
      10
    )

    if (!Number.isNaN(stepTxtNumber)) {
      startStep = stepTxtNumber
    }
  } catch {
    // No step.txt file found, start from the beginning
  }
}

async function runCommand() {
  console.log()
  console.log('Rebuilding test project fixture...')
  console.log('Using temporary directory:', OUTPUT_PROJECT_PATH)
  console.log()

  // Maybe we could add all of the tasks to an array and infer the `step` from
  // the array index?
  // I'd also want to be able to skip sub-tasks. Like both the "web" step and
  // the "api" step both have a bunch of sub-tasks. So maybe the step.txt file
  // should contain something like "9.2" to mean the third sub-task of the
  // "api" step? And --resume-step would also accept stuff like "9.2"?
  await tuiTask({
    step: 0,
    title: 'Creating project',
    content: 'Building test-project from scratch...',
    task: createProject,
    skip: skipStep(startStep, 0),
  })

  await tuiTask({
    step: 1,
    title: '[link] Building Redwood framework',
    content: 'yarn build:clean && yarn build',
    task: async () => {
      return exec(
        'yarn build:clean && yarn build',
        [],
        getExecaOptions(RW_FRAMEWORKPATH)
      )
    },
    skip: skipStep(startStep, 1),
  })

  await tuiTask({
    step: 2,
    title: '[link] Adding framework dependencies to project',
    content: 'Adding framework dependencies to project...',
    task: () => {
      return addFrameworkDepsToProject(
        RW_FRAMEWORKPATH,
        OUTPUT_PROJECT_PATH,
        'pipe' // TODO: Remove this when everything is using @rwjs/tui
      )
    },
    skip: skipStep(startStep, 2),
  })

  await tuiTask({
    step: 3,
    title: 'Installing node_modules',
    content: 'yarn install',
    task: () => {
      return exec('yarn install', getExecaOptions(OUTPUT_PROJECT_PATH))
    },
    skip: skipStep(startStep, 3),
  })

  await tuiTask({
    step: 4,
    title: 'Updating ports in redwood.toml...',
    task: () => {
      // We do this, to make it easier to run multiple test projects in parallel
      // But on different ports. If API_DEV_PORT or WEB_DEV_PORT aren't supplied,
      // It just defaults to 8910 and 8911
      // This is helpful in playwright smoke tests to allow us to parallelize
      const REDWOOD_TOML_PATH = path.join(OUTPUT_PROJECT_PATH, 'redwood.toml')
      const redwoodToml = fs.readFileSync(REDWOOD_TOML_PATH).toString()
      let newRedwoodToml = redwoodToml

      newRedwoodToml = newRedwoodToml.replace(
        /\port = 8910/,
        'port = "${WEB_DEV_PORT:8910}"'
      )

      newRedwoodToml = newRedwoodToml.replace(
        /\port = 8911/,
        'port = "${API_DEV_PORT:8911}"'
      )

      fs.writeFileSync(REDWOOD_TOML_PATH, newRedwoodToml)
    },
    skip: skipStep(startStep, 4),
  })

  await tuiTask({
    step: 5,
    title: '[link] Copying framework packages to project',
    task: () => {
      return copyFrameworkPackages(
        RW_FRAMEWORKPATH,
        OUTPUT_PROJECT_PATH,
        'pipe'
      )
    },
    skip: skipStep(startStep, 5),
  })

  // Note that we undo this at the end
  await tuiTask({
    step: 6,
    title: '[link] Add rwfw project:copy postinstall',
    task: () => {
      return updatePkgJsonScripts({
        projectPath: OUTPUT_PROJECT_PATH,
        scripts: {
          postinstall: 'yarn rwfw project:copy',
        },
      })
    },
    skip: skipStep(startStep, 6),
  })

  await tuiTask({
    step: 7,
    title: 'Apply web codemods',
    task: () => {
      return webTasks(OUTPUT_PROJECT_PATH, {
        linkWithLatestFwBuild: true,
      })
    },
    skip: skipStep(startStep, 7),
  })

  await tuiTask({
    step: 8,
    title: 'Apply api codemods',
    task: () => {
      return apiTasks(OUTPUT_PROJECT_PATH, {
        linkWithLatestFwBuild: true,
      })
    },
    skip: skipStep(startStep, 8),
  })

  await tuiTask({
    step: 9,
    title: 'Running prisma migrate reset',
    task: () => {
      return exec(
        'yarn rw prisma migrate reset',
        ['--force'],
        getExecaOptions(OUTPUT_PROJECT_PATH)
      )
    },
    skip: skipStep(startStep, 9),
  })

  await tuiTask({
    step: 10,
    title: 'Lint --fix all the things',
    task: async () => {
      try {
        await exec('yarn rw lint --fix', [], {
          shell: true,
          stdio: 'pipe',
          cleanup: true,
          cwd: OUTPUT_PROJECT_PATH,
          env: {
            RW_PATH: path.join(__dirname, '../../'),
          },
        })
      } catch (e) {
        if (
          e instanceof ExecaError &&
          !e.stderr &&
          e.stdout.includes('15 problems (15 errors, 0 warnings)')
        ) {
          // This is unfortunate, but linting is expected to fail.
          // This is the expected error message, so we just fall through
          // If the expected error message changes you'll have to update the
          // `includes` check above
        } else {
          // Unexpected error. Rethrow
          throw e
        }
      }
    },
    skip: skipStep(startStep, 10),
  })

  await tuiTask({
    step: 11,
    title: 'Replace and Cleanup Fixture',
    task: async () => {
      // @TODO: This only works on UNIX, we should use path.join everywhere
      // remove all .gitignore
      await rimraf(`${OUTPUT_PROJECT_PATH}/.redwood/**/*`, {
        glob: {
          ignore: `${OUTPUT_PROJECT_PATH}/.redwood/README.md`,
        },
      })
      await rimraf(`${OUTPUT_PROJECT_PATH}/api/db/dev.db`)
      await rimraf(`${OUTPUT_PROJECT_PATH}/api/db/dev.db-journal`)
      await rimraf(`${OUTPUT_PROJECT_PATH}/api/dist`)
      await rimraf(`${OUTPUT_PROJECT_PATH}/node_modules`)
      await rimraf(`${OUTPUT_PROJECT_PATH}/web/node_modules`)
      await rimraf(`${OUTPUT_PROJECT_PATH}/.env`)
      await rimraf(`${OUTPUT_PROJECT_PATH}/yarn.lock`)
      await rimraf(`${OUTPUT_PROJECT_PATH}/step.txt`)

      // Copy over package.json from template, so we remove the extra dev dependencies, and rwfw postinstall script
      // that we added in "Adding framework dependencies to project"
      await rimraf(`${OUTPUT_PROJECT_PATH}/package.json`)
      fs.copyFileSync(
        path.join(
          __dirname,
          '../../packages/create-redwood-app/templates/ts/package.json'
        ),
        path.join(OUTPUT_PROJECT_PATH, 'package.json')
      )

      // removes existing Fixture and replaces with newly built project,
      // then removes new Project temp directory
      await copyProject()
    },
    skip: skipStep(startStep, 11),
  })

  await tuiTask({
    step: 12,
    title: 'All done!',
    task: () => {
      console.log('-'.repeat(30))
      console.log()
      console.log('✅ Success! The test project fixture has been rebuilt')
      console.log()
      console.log('-'.repeat(30))
    },
    enabled: verbose,
  })
}

runCommand()
