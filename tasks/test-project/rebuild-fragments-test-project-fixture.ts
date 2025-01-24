import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import chalk from 'chalk'
import fse from 'fs-extra'
import { rimraf } from 'rimraf'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { RedwoodTUI, ReactiveTUIContent, RedwoodStyling } from '@redwoodjs/tui'

import {
  addFrameworkDepsToProject,
  copyFrameworkPackages,
} from './frameworkLinking'
import { webTasks, apiTasks, fragmentsTasks } from './tui-tasks'
import { isAwaitable, isTuiError } from './typing'
import type { TuiTaskDef } from './typing'
import {
  getExecaOptions as utilGetExecaOptions,
  updatePkgJsonScripts,
  ExecaError,
  exec,
} from './util'

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
    describe: 'Resume rebuild of the latest unfinished fragment-test-project',
  })
  .option('resumePath', {
    type: 'string',
    describe: 'Resume rebuild given the specified fragment-test-project path',
  })
  .option('resumeStep', {
    type: 'string',
    describe: 'Resume rebuild from the given step',
  })
  .help()
  .parseSync()

const { verbose, resume, resumePath, resumeStep } = args

const RW_FRAMEWORK_PATH = path.join(__dirname, '../../')
const OUTPUT_PROJECT_PATH = resumePath
  ? /* path.resolve(String(resumePath)) */ resumePath
  : path.join(
      os.tmpdir(),
      'redwood-fragment-test-project',
      // ":" is problematic with paths
      new Date().toISOString().split(':').join('-'),
    )

let startStep = resumeStep || ''

if (!startStep) {
  // Figure out what step to restart the rebuild from
  try {
    const stepTxt = fs.readFileSync(
      path.join(OUTPUT_PROJECT_PATH, 'step.txt'),
      'utf-8',
    )

    if (stepTxt) {
      startStep = stepTxt
    }
  } catch {
    // No step.txt file found, start from the beginning
  }
}

const tui = new RedwoodTUI()

function getExecaOptions(cwd: string) {
  return { ...utilGetExecaOptions(cwd), stdio: 'pipe' }
}

function beginStep(step: string) {
  fs.mkdirSync(OUTPUT_PROJECT_PATH, { recursive: true })
  fs.writeFileSync(path.join(OUTPUT_PROJECT_PATH, 'step.txt'), '' + step)
}

async function tuiTask({ step, title, content, task, parent }: TuiTaskDef) {
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

  beginStep(stepId)

  let skip = skipFn(startStep, stepId)

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

  let promise: void | Promise<unknown>

  try {
    promise = task()
  } catch (e) {
    // This code handles errors from synchronous tasks

    tui.stopReactive(true)

    if (e instanceof ExecaError) {
      tui.displayError(
        'Failed ' + title.toLowerCase().replace('...', ''),
        'stdout:\n' + e.stdout + '\n\n' + 'stderr:\n' + e.stderr,
      )
    } else {
      const message = isTuiError(e) ? e.message : ''

      tui.displayError(
        'Failed ' + title.toLowerCase().replace('...', ''),
        message || '',
      )
    }

    const exitCode = isTuiError(e) ? e.exitCode : undefined
    process.exit(exitCode)
  }

  if (isAwaitable(promise)) {
    const result = await promise.catch((e) => {
      // This code handles errors from asynchronous tasks

      tui.stopReactive(true)

      if (e instanceof ExecaError) {
        tui.displayError(
          'Failed ' + title.toLowerCase().replace('...', ''),
          'stdout:\n' + e.stdout + '\n\n' + 'stderr:\n' + e.stderr,
        )
      } else {
        tui.displayError(
          'Failed ' + title.toLowerCase().replace('...', ''),
          e.message,
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
 * Function that returns a string to show when skipping the task, or just
 * true|false to indicate whether the task should be skipped or not.
 */
function skipFn(startStep: string, currentStep: string) {
  const startStepNrs = startStep.split('.').map((s) => parseInt(s, 10))
  const currentStepNrs = currentStep.split('.').map((s) => parseInt(s, 10))

  for (let i = 0; i < startStepNrs.length; i++) {
    if (startStepNrs[i] > currentStepNrs[i]) {
      return 'Skipping... Resuming from step ' + startStep
    }
  }

  return false
}

if (resume) {
  console.error(
    chalk.red.bold(
      '\n`resume` option is not supported yet. ' +
        'Please use `resumePath` instead.\n',
    ),
  )

  process.exit(1)
}

if (resumePath && !fs.existsSync(path.join(resumePath, 'redwood.toml'))) {
  console.error(
    chalk.red.bold(
      `
      No redwood.toml file found at the given path: ${resumePath}
      `,
    ),
  )
  process.exit(1)
}

const createProject = () => {
  const cmd = `yarn node ./packages/create-redwood-app/dist/create-redwood-app.js ${OUTPUT_PROJECT_PATH}`

  const subprocess = exec(
    cmd,
    // We create a ts project and convert using ts-to-js at the end if typescript flag is false
    ['--no-yarn-install', '--typescript', '--overwrite', '--no-git'],
    getExecaOptions(RW_FRAMEWORK_PATH),
  )

  return subprocess
}

const copyProject = async () => {
  const fixturePath = path.join(
    RW_FRAMEWORK_PATH,
    '__fixtures__/fragment-test-project',
  )

  // remove existing Fixture
  await rimraf(fixturePath)
  // copy from tempDir to Fixture dir
  await fse.copy(OUTPUT_PROJECT_PATH, fixturePath)
  // cleanup after ourselves
  await rimraf(OUTPUT_PROJECT_PATH)
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
    content: 'Building fragment-test-project from scratch...',
    task: createProject,
  })

  await tuiTask({
    step: 1,
    title: '[link] Building Redwood framework',
    content: 'yarn build:clean && yarn build',
    task: async () => {
      return exec(
        'yarn build:clean && yarn build',
        [],
        getExecaOptions(RW_FRAMEWORK_PATH),
      )
    },
  })

  await tuiTask({
    step: 2,
    title: '[link] Adding framework dependencies to project',
    content: 'Adding framework dependencies to project...',
    task: () => {
      return addFrameworkDepsToProject(
        RW_FRAMEWORK_PATH,
        OUTPUT_PROJECT_PATH,
        'pipe', // TODO: Remove this when everything is using @rwjs/tui
      )
    },
  })

  await tuiTask({
    step: 3,
    title: 'Installing node_modules',
    content: 'yarn install',
    task: () => {
      return exec('yarn install', getExecaOptions(OUTPUT_PROJECT_PATH))
    },
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
        'port = "${WEB_DEV_PORT:8910}"',
      )

      newRedwoodToml = newRedwoodToml.replace(
        /\port = 8911/,
        'port = "${API_DEV_PORT:8911}"',
      )

      fs.writeFileSync(REDWOOD_TOML_PATH, newRedwoodToml)
    },
  })

  await tuiTask({
    step: 5,
    title: '[link] Copying framework packages to project',
    task: () => {
      return copyFrameworkPackages(
        RW_FRAMEWORK_PATH,
        OUTPUT_PROJECT_PATH,
        'pipe',
      )
    },
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
  })

  await tuiTask({
    step: 7,
    title: 'Apply web codemods',
    task: () => {
      return webTasks(OUTPUT_PROJECT_PATH, {
        linkWithLatestFwBuild: true,
      })
    },
  })

  await tuiTask({
    step: 8,
    title: 'Apply api codemods',
    task: () => {
      return apiTasks(OUTPUT_PROJECT_PATH, {
        linkWithLatestFwBuild: true,
      })
    },
  })

  await tuiTask({
    step: 9,
    title: 'Running prisma migrate reset',
    task: () => {
      return exec(
        'yarn rw prisma migrate reset',
        ['--force'],
        getExecaOptions(OUTPUT_PROJECT_PATH),
      )
    },
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
          e.stdout.includes('13 problems (13 errors, 0 warnings)')
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
  })

  await tuiTask({
    step: 11,
    title: 'Run fragments tasks',
    task: () => {
      return fragmentsTasks(OUTPUT_PROJECT_PATH)
    },
  })

  await tuiTask({
    step: 12,
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
          '../../packages/create-redwood-app/templates/ts/package.json',
        ),
        path.join(OUTPUT_PROJECT_PATH, 'package.json'),
      )

      // removes existing Fixture and replaces with newly built project,
      // then removes new Project temp directory
      await copyProject()
    },
  })

  await tuiTask({
    step: 13,
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
