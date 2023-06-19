#!/usr/bin/env node
/* eslint-env node, es6*/
//@ts-check
const fs = require('fs')
const os = require('os')
const path = require('path')

const execa = require('execa')
const fse = require('fs-extra')
const { rimraf } = require('rimraf')
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')

const { RedwoodTUI } = require('@redwoodjs/tui')

const {
  addFrameworkDepsToProject,
  copyFrameworkPackages,
} = require('./frameworkLinking')
const { getCellMockTasks } = require('./rebuild-tasks/cellMocks')
const { getCellTasks } = require('./rebuild-tasks/cells')
const { getComponentTasks } = require('./rebuild-tasks/components')
const { runDBAuthTask } = require('./rebuild-tasks/dbAuth')
const { getLayoutTasks } = require('./rebuild-tasks/layouts')
const { getPageTasks } = require('./rebuild-tasks/pages')
const { getPrerenderTasks } = require('./rebuild-tasks/prerender')
const {
  getExecaOptions,
  execAndStreamCodemod,
  fullPath,
  addModelToPrismaSchema,
  execAndStreamRedwoodCommand,
} = require('./rebuild-tasks/util')
const { updatePkgJsonScripts } = require('./util')

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

// /** @type {(string) => import('execa').Options} */
// function getExecaOptions(cwd) {
//   return {
//     ...utilGetExecaOptions(cwd),
//     stdio: 'pipe',
//   }
// }

// /**
//  * @param {number} step
//  */
// function beginStep(step) {
//   fs.mkdirSync(OUTPUT_PROJECT_PATH, { recursive: true })
//   fs.writeFileSync(path.join(OUTPUT_PROJECT_PATH, 'step.txt'), '' + step)
// }

// /**
//  * @param {number} startStep
//  * @param {number} step
//  */
// function skipStep(startStep, step) {
//   return () => {
//     if (startStep > step) {
//       return 'Skipping... Resuming from step ' + startStep
//     }

//     return false
//   }
// }

// if (resume) {
//   console.error(
//     chalk.red.bold(
//       '\n`resume` option is not supported yet. ' +
//         'Please use `resumePath` instead.\n'
//     )
//   )

//   process.exit(1)
// }

// if (resumePath && !fs.existsSync(path.join(resumePath, 'redwood.toml'))) {
//   console.error(
//     chalk.red.bold(
//       `
//       No redwood.toml file found at the given path: ${resumePath}
//       `
//     )
//   )
//   process.exit(1)
// }

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
  console.log('Generating project at ' + OUTPUT_PROJECT_PATH)

  /**
   * TODO:
   * Check to see if the directory already exists and has a git repo in it.
   *
   * If it does, find the last commited task and resume from there.
   *   If a step is given as an argument, resume from that step.
   *   If the step given is before the last commited step, rollback to that commit and resume from there.
   *
   * If the folder exists but the git repo is not initialized. Throw an error.
   * If the folder doesn't exist and the git repo is not initialized, initialize it and start from the beginning.
   *
   */

  const tasks = [
    {
      title: 'Creating project',
      task: async (task) => {
        const subprocess = execa(
          `yarn node ./packages/create-redwood-app/dist/create-redwood-app.js ${OUTPUT_PROJECT_PATH}`,
          ['--no-yarn-install', '--typescript', '--overwrite', '--no-git'],
          getExecaOptions(RW_FRAMEWORKPATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'Running create redwood-app' },
        })
        await subprocess
      },
      skip: startStep > 0,
    },
    {
      title: 'Temporary (v6): add storybook to web dependencies',
      task: async (task) => {
        const subprocess = execa(
          'yarn',
          ['workspace web add -D storybook'],
          getExecaOptions(OUTPUT_PROJECT_PATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'yarn workspace web add -D storybook' },
        })
        await subprocess
      },
      skip: startStep > 1,
    },
    {
      title: '[link] Building Redwood framework',
      task: async (task) => {
        const subprocess = execa(
          'yarn',
          ['build:clean && yarn build'],
          getExecaOptions(RW_FRAMEWORKPATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'yarn build:clean && yarn build' },
        })
        await subprocess
      },
      skip: startStep > 2,
    },
    {
      title: '[link] Adding framework dependencies to project',
      task: async (task) => {
        const subprocess = addFrameworkDepsToProject(
          RW_FRAMEWORKPATH,
          OUTPUT_PROJECT_PATH,
          'pipe'
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'yarn rwfw project:deps' },
        })
        await subprocess
      },
      skip: startStep > 3,
    },
    {
      title: 'Installing node_modules',
      task: async (task) => {
        const subprocess = execa(
          'yarn',
          ['install'],
          getExecaOptions(OUTPUT_PROJECT_PATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'yarn install' },
        })
        await subprocess
      },
      skip: startStep > 4,
    },
    {
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
      skip: startStep > 5,
    },
    {
      title: '[link] Copying framework packages to project',
      task: async (task) => {
        const subprocess = copyFrameworkPackages(
          RW_FRAMEWORKPATH,
          OUTPUT_PROJECT_PATH,
          'pipe'
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'yarn rwfw project:copy' },
        })
        await subprocess
      },
      skip: startStep > 6,
    },
    {
      title: '[link] Add rwfw project:copy postinstall',
      task: () => {
        updatePkgJsonScripts({
          projectPath: OUTPUT_PROJECT_PATH,
          scripts: {
            postinstall: 'yarn rwfw project:copy',
          },
        })
      },
      skip: startStep > 7,
    },
    {
      title: 'Apply web codemods',
      task: [
        {
          title: 'Creating pages',
          task: getPageTasks(OUTPUT_PROJECT_PATH),
        },
        {
          title: 'Creating layout',
          task: getLayoutTasks(OUTPUT_PROJECT_PATH),
        },
        {
          title: 'Creating components',
          task: getComponentTasks(OUTPUT_PROJECT_PATH),
        },
        {
          title: 'Creating cells',
          task: getCellTasks(OUTPUT_PROJECT_PATH),
        },
        {
          title: 'Updating cell mocks',
          task: getCellMockTasks(OUTPUT_PROJECT_PATH),
        },
        {
          title: 'Changing routes',
          task: async (task) => {
            await execAndStreamCodemod(
              task,
              'routes.js',
              fullPath(OUTPUT_PROJECT_PATH, 'web/src/Routes')
            )
          },
        },
        // ====== NOTE: rufus needs this workaround for tailwind =======
        // Setup tailwind in a linked project, due to rwfw we install deps manually
        {
          title: 'Install tailwind dependencies',
          // @NOTE: use rwfw, because calling the copy function doesn't seem to work here
          task: async (task) => {
            const subprocess = execa(
              'yarn',
              [
                'workspace web add -D postcss postcss-loader tailwindcss autoprefixer prettier-plugin-tailwindcss',
              ],
              getExecaOptions(OUTPUT_PROJECT_PATH)
            )
            task.streamFromExeca(subprocess, {
              boxen: {
                title:
                  'yarn workspace web add -D postcss postcss-loader tailwindcss autoprefixer prettier-plugin-tailwindcss',
              },
            })
            await subprocess
          },
        },
        {
          title: '[link] Copy local framework files again',
          // @NOTE: use rwfw, because calling the copy function doesn't seem to work here
          task: async (task) => {
            const subprocess = execa(
              'yarn',
              ['rwfw', 'project:copy'],
              getExecaOptions(OUTPUT_PROJECT_PATH)
            )
            task.streamFromExeca(subprocess, {
              boxen: { title: 'yarn rwfw project:copy' },
            })
            await subprocess
          },
        },
        // =========
        {
          title: 'Adding Tailwind',
          task: async (task) => {
            await execAndStreamRedwoodCommand(
              task,
              ['setup', 'ui', 'tailwindcss', '--force', '--no-install'],
              OUTPUT_PROJECT_PATH
            )
          },
        },
      ],
      skip: startStep > 8,
    },
    {
      title: 'Apply api codemods',
      task: [
        {
          title: 'Adding post model to prisma',
          task: async (task) => {
            // Need both here since they have a relation
            const { post, user } = await import('./codemods/models.js')

            addModelToPrismaSchema(OUTPUT_PROJECT_PATH, post)
            addModelToPrismaSchema(OUTPUT_PROJECT_PATH, user)

            await execAndStreamRedwoodCommand(
              task,
              ['prisma migrate dev --name create_post_user'],
              OUTPUT_PROJECT_PATH
            )
          },
        },
        {
          title: 'Scaffolding post',
          task: async (task) => {
            await execAndStreamRedwoodCommand(
              task,
              ['generate', 'scaffold', 'post'],
              OUTPUT_PROJECT_PATH
            )
            await execAndStreamCodemod(
              task,
              'scenarioValueSuffix.js',
              fullPath(
                OUTPUT_PROJECT_PATH,
                'api/src/services/posts/posts.scenarios'
              )
            )
            const subprocess = execa(
              'yarn',
              ['rwfw', 'project:copy'],
              getExecaOptions(OUTPUT_PROJECT_PATH)
            )
            task.streamFromExeca(subprocess, {
              boxen: { title: 'yarn rwfw project:copy' },
            })
            await subprocess
          },
        },
        {
          title: 'Adding seed script',
          task: async (task) => {
            await execAndStreamCodemod(
              task,
              'seed.js',
              fullPath(OUTPUT_PROJECT_PATH, 'scripts/seed.ts', {
                addExtension: false,
              })
            )
          },
        },
        {
          title: 'Adding contact model to prisma',
          task: async (task) => {
            const { contact } = await import('./codemods/models.js')
            addModelToPrismaSchema(OUTPUT_PROJECT_PATH, contact)
            await execAndStreamRedwoodCommand(
              task,
              ['prisma migrate dev --name create_contact'],
              OUTPUT_PROJECT_PATH
            )
            await execAndStreamRedwoodCommand(
              task,
              ['generate', 'scaffold', 'contacts'],
              OUTPUT_PROJECT_PATH
            )
          },
        },
        {
          // This task renames the migration folders so that we don't have to deal with duplicates/conflicts when committing to the repo
          title: 'Adjust dates within migration folder names',
          task: () => {
            const migrationsFolderPath = path.join(
              OUTPUT_PROJECT_PATH,
              'api',
              'db',
              'migrations'
            )
            // Migration folders are folders which start with 14 digits because they have a yyyymmddhhmmss
            const migrationFolders = fs
              .readdirSync(migrationsFolderPath)
              .filter((name) => {
                return (
                  name.match(/\d{14}.+/) &&
                  fs
                    .lstatSync(path.join(migrationsFolderPath, name))
                    .isDirectory()
                )
              })
              .sort()
            const datetime = new Date('2022-01-01T12:00:00.000Z')
            migrationFolders.forEach((name) => {
              const datetimeInCorrectFormat =
                datetime.getFullYear() +
                ('0' + (datetime.getMonth() + 1)).slice(-2) +
                ('0' + datetime.getDate()).slice(-2) +
                '120000' // Time hardcoded to 12:00:00 to limit TZ issues
              fs.renameSync(
                path.join(migrationsFolderPath, name),
                path.join(
                  migrationsFolderPath,
                  `${datetimeInCorrectFormat}${name.substring(14)}`
                )
              )
              datetime.setDate(datetime.getDate() + 1)
            })
          },
        },
        {
          title: 'Add dbAuth',
          task: async (task) => {
            await runDBAuthTask(task, OUTPUT_PROJECT_PATH)
          },
        },
        {
          title: 'Add users service',
          task: async (task) => {
            // const generateSdl = createBuilder('yarn redwood g sdl --no-crud')
            await execAndStreamRedwoodCommand(
              task,
              ['generate', 'sdl', 'user', '--no-crud'],
              OUTPUT_PROJECT_PATH
            )
            await execAndStreamCodemod(
              task,
              'usersSdl.js',
              fullPath(OUTPUT_PROJECT_PATH, 'api/src/graphql/users.sdl')
            )
            await execAndStreamCodemod(
              task,
              'usersService.js',
              fullPath(OUTPUT_PROJECT_PATH, 'api/src/services/users/users')
            )

            // Replace the random numbers in the scenario with consistent values
            await execAndStreamCodemod(
              task,
              'scenarioValueSuffix.js',
              fullPath(
                OUTPUT_PROJECT_PATH,
                'api/src/services/users/users.scenarios'
              )
            )

            const test = `import { user } from './users'
                import type { StandardScenario } from './users.scenarios'

                describe('users', () => {
                  scenario('returns a single user', async (scenario: StandardScenario) => {
                    const result = await user({ id: scenario.user.one.id })

                    expect(result).toEqual(scenario.user.one)
                  })
                })`.replaceAll(/ {12}/g, '')

            fs.writeFileSync(
              fullPath(
                OUTPUT_PROJECT_PATH,
                'api/src/services/users/users.test'
              ),
              test
            )

            await execAndStreamRedwoodCommand(
              task,
              ['generate', 'types'],
              OUTPUT_PROJECT_PATH
            )
          },
        },
      ],
      skip: startStep > 9,
    },
    {
      title: 'Enabling prerender on routes',
      task: getPrerenderTasks(OUTPUT_PROJECT_PATH),
    },
    {
      title: 'Running prisma migrate reset',
      task: async (task) => {
        const subprocess = execa(
          'yarn',
          ['rw', 'prisma migrate reset', '--force'],
          getExecaOptions(OUTPUT_PROJECT_PATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'yarn rw prisma migrate reset --force' },
        })
        await subprocess
      },
      skip: startStep > 10,
    },
    {
      title: 'Lint --fix all the things',
      task: async (task) => {
        const subprocess = execa(
          'yarn',
          ['rw', 'lint', '--fix'],
          getExecaOptions(OUTPUT_PROJECT_PATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'yarn rw lint --fix' },
        })
        await subprocess
      },
      skip: startStep > 11,
    },
    {
      title: 'Replace and Cleanup Fixture',
      task: async () => {
        // @TODO: This only works on UNIX, we should use path.join everywhere
        // remove all .gitignore
        await rimraf(`${OUTPUT_PROJECT_PATH}/.redwood`)
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
      },
    },
    {
      title: 'All done!',
      task: (task) => {
        task.content = verbose
          ? [
              '',
              '-'.repeat(30),
              '',
              '✅ Success your project has been generated at:',
              OUTPUT_PROJECT_PATH,
              '',
              '-'.repeat(30),
            ].join('\n')
          : `Generated project at ${OUTPUT_PROJECT_PATH}`
      },
    },
  ]

  await tui.runTasks(tasks)
}

runCommand()
