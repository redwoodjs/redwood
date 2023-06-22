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

const { TUITask } = require('@redwoodjs/tui/dist/tasks')

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

// Try to get the last temporary directory that was used so we can automatically
// know the folder to resume with
const cacheFile = path.join(os.tmpdir(), 'redwood-test-project', 'resume.txt')
let lastTemporaryDirectory
try {
  if (fs.existsSync(cacheFile)) {
    lastTemporaryDirectory = fs
      .readFileSync(cacheFile, {
        encoding: 'utf-8',
        flag: 'r',
      })
      .trim()

    // Make sure the directory actually exists
    if (!fs.existsSync(lastTemporaryDirectory)) {
      lastTemporaryDirectory = undefined
    }
  }
} catch (_error) {
  // We don't care if this fails, this is just for convenience
}

// Parse the CLI arguments
const { verbose, resume, resumePath, resumeStep } = yargs(hideBin(process.argv))
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
    default: lastTemporaryDirectory,
  })
  .option('resumeStep', {
    type: 'string',
    describe: 'Resume rebuild from the given step',
  })
  .help()
  .parseSync()

if (resume && resumePath === undefined) {
  console.error(
    'Could not resume test-project rebuild without a "resumePath" argument. No previous test-project found automatically.'
  )
  process.exit(1)
}

const RW_FRAMEWORKPATH = path.join(__dirname, '../../')
const OUTPUT_PROJECT_PATH = resume
  ? resumePath ?? '' // This ?? is just to make the typing happy it'll never be undefined given the check above
  : path.join(
      os.tmpdir(),
      'redwood-test-project',
      // ":" is problematic with paths
      new Date().toISOString().split(':').join('-')
    )
if (!fs.existsSync(OUTPUT_PROJECT_PATH)) {
  fs.mkdirSync(OUTPUT_PROJECT_PATH, { recursive: true })
  execa.sync('git', ['init'], {
    cwd: OUTPUT_PROJECT_PATH,
    stdio: 'ignore',
  })
  fs.writeFileSync(cacheFile, OUTPUT_PROJECT_PATH)
}

// Check for existing indices from previously committed steps
const existingIndices = []
let resumeFromIndex = resumeStep

if (resume) {
  try {
    const subprocess = execa.sync('git', ['log', '--oneline'], {
      cwd: OUTPUT_PROJECT_PATH,
      stdio: 'pipe',
    })
    subprocess.stdout.split('\n').forEach((line) => {
      const parts = line.split(' ')
      existingIndices.push(parts[parts.length - 1])
    })
  } catch (error) {
    console.error('Failed to get git log')
    console.error(error)
    process.exit(1)
  }

  // Start from the last index if no step is given
  if (resumeStep === undefined) {
    // git log will be sorted by time so that index 0 should be the latest commit and hence the last step
    resumeFromIndex = existingIndices[0].replace('x', '')
  }
}

function indexIsLower(index, comparisonIndex) {
  const levels1 = index.split('.')
  const levels2 = comparisonIndex.split('.')
  // Loop through the levels until one index is exhausted
  for (let i = 0; i < Math.max(levels1.length, levels2.length); i++) {
    const level1 = parseInt(levels1[i]) || 0 // Use 0 if level is undefined or NaN
    const level2 = parseInt(levels2[i]) || 0 // Use 0 if level is undefined or NaN
    if (level1 < level2) {
      return true // index1 is less than index2
    } else if (level1 > level2) {
      return false // index1 is greater than index2
    }
    // Continue to the next level
  }
  return false // index1 and index2 are equal
}

function insertSkipByIndex(tasks, startIndex) {
  for (const task of tasks) {
    if (typeof task.task !== 'function') {
      insertSkipByIndex(task.task, startIndex)
      // Continue because we only want to skip the leaf tasks
      continue
    }
    task.skip = (task) => {
      return indexIsLower(task.index, startIndex) || task.index === startIndex
    }
  }
}

function insertCommitOnComplete(tasks) {
  for (const task of tasks) {
    if (typeof task.task !== 'function') {
      insertCommitOnComplete(task.task)
      // Continue because we only want to commit the leaf tasks
      continue
    }
    task.onComplete = async (task) => {
      await execa('git', ['add', '.'], {
        cwd: OUTPUT_PROJECT_PATH,
        stdio: 'pipe',
      })
      await execa(
        'git',
        ['commit', '-m', `${task.index}x`, '--no-gpg-sign', '--allow-empty'],
        {
          cwd: OUTPUT_PROJECT_PATH,
          stdio: 'pipe',
        }
      )
    }
  }
}

async function runCommand() {
  console.log("\nRebuilding 'test-project' fixture")
  console.log(
    `${resume ? 'Resuming' : 'Generating'} project at ${OUTPUT_PROJECT_PATH}`
  )
  console.log()

  const tasks = [
    {
      title: 'Preparing to resume',
      task: async (task) => {
        let subprocess = execa(
          `git`,
          ['clean', '-fd'],
          getExecaOptions(OUTPUT_PROJECT_PATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'git clean -fd' },
        })
        await subprocess

        subprocess = execa(
          `git`,
          ['reset', '--hard', `:/${resumeFromIndex}x`],
          getExecaOptions(OUTPUT_PROJECT_PATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: { title: 'git reset --hard' },
        })
        await subprocess
      },
    },
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
    },
    {
      title:
        'Temporary (v6): Add storybook and vite canary to web dependencies',
      task: async (task) => {
        const subprocess = execa(
          'yarn',
          ['workspace web add -D storybook @redwoodjs/vite@6.0.0-canary.450'],
          getExecaOptions(OUTPUT_PROJECT_PATH)
        )
        task.streamFromExeca(subprocess, {
          boxen: {
            title:
              'yarn workspace web add -D storybook @redwoodjs/vite@6.0.0-canary.450',
          },
        })
        await subprocess
      },
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
    },
    {
      title: 'Lint --fix all the things',
      task: async (task) => {
        try {
          const subprocess = execa(
            'yarn',
            ['rw', 'lint', '--fix'],
            getExecaOptions(OUTPUT_PROJECT_PATH)
          )
          task.streamFromExeca(subprocess, {
            boxen: { title: 'yarn rw lint --fix' },
          })
          await subprocess
        } catch (error) {
          if (
            !error.stderr &&
            error.stdout.includes('14 problems (14 errors, 0 warnings)')
          ) {
            // This is unfortunate, but linting is expected to fail.
            // This is the expected error message, so we just fall through
            // If the expected error message changes you'll have to update the
            // `includes` check above
          } else {
            // Unexpected error. Rethrow
            throw error
          }
        }
      },
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
      task: async () => {
        process.on('exit', () => {
          console.log()
          console.log(
            verbose
              ? [
                  '-'.repeat(30),
                  '',
                  '✅ Success your project has been generated at:',
                  OUTPUT_PROJECT_PATH,
                  '',
                  '-'.repeat(30),
                ].join('\n')
              : `Generated project at ${OUTPUT_PROJECT_PATH}`
          )
        })
      },
    },
  ]

  // Insert skip conditions
  if (resume && resumeFromIndex) {
    insertSkipByIndex(tasks, resumeFromIndex)
  }
  tasks[0].skip = !resume

  // Insert onComplete to commit that step
  insertCommitOnComplete(tasks)
  tasks[0].onComplete = undefined
  tasks[tasks.length - 2].onComplete = undefined
  tasks[tasks.length - 1].onComplete = undefined

  await TUITask.run(tasks)
}

runCommand()
