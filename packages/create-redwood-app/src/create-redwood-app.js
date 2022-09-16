#!/usr/bin/env node

// This downloads the latest release of Redwood from https://github.com/redwoodjs/create-redwood-app/
// and extracts it into the supplied directory.
//
// Usage:
// `$ yarn create redwood-app ./path/to/new-project`

import { spawn } from 'child_process'
import path from 'path'

import chalk from 'chalk'
import checkNodeVersion from 'check-node-version'
import execa from 'execa'
import fs from 'fs-extra'
import Listr from 'listr'
import { paramCase } from 'param-case'
import prompts from 'prompts'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { name, version } from '../package'

/**
 * To keep a consistent color/style palette between cli packages, such as
 * @redwood/create-redwood-app and @redwood/cli, please keep them compatible
 * with one and another. We'll might split up and refactor these into a
 * separate package when there is a strong motivation behind it.
 *
 * Current files:
 *
 * - packages/cli/src/lib/colors.js
 * - packages/create-redwood-app/src/create-redwood-app.js (this file)
 *
 */
;(async () => {
  // Styles for terminal
  const style = {
    error: chalk.bold.red,
    warning: chalk.keyword('orange'),
    success: chalk.greenBright,
    info: chalk.grey,

    header: chalk.bold.underline.hex('#e8e8e8'),
    cmd: chalk.hex('#808080'),
    redwood: chalk.hex('#ff845e'),
    love: chalk.redBright,

    green: chalk.green,
  }

  // Initial welcome message
  console.log(
    `${style.redwood(
      '------------------------------------------------------------------'
    )}`
  )
  console.log(`🌲⚡️ ${style.header('Welcome to RedwoodJS!')} ⚡️🌲`)
  console.log(
    `${style.redwood(
      '------------------------------------------------------------------'
    )}`
  )

  // Specify template dir
  const templateDir = path.resolve(__dirname, '../template')

  // Extract the args as provided by the user in the command line
  const {
    _: args,
    'yarn-install': yarnInstall,
    typescript,
    overwrite,
    telemetry: telemetry,
    yarn1,
    'git-init': gitInit,
    'language-target': languageTarget,
  } = yargs(hideBin(process.argv))
    .scriptName(name)
    .usage('Usage: $0 <project directory> [option]')
    .example('$0 newapp')
    .option('yarn-install', {
      default: true,
      type: 'boolean',
      describe:
        'Skip yarn install with --no-yarn-install. Also skips version requirements check.',
    })
    .option('typescript', {
      alias: 'ts',
      default: null,
      type: 'boolean',
      describe: 'Generate a TypeScript project.',
    })
    .option('overwrite', {
      default: false,
      type: 'boolean',
      describe: "Create even if target directory isn't empty",
    })
    .option('telemetry', {
      default: true,
      type: 'boolean',
      describe:
        'Enables sending telemetry events for this create command and all Redwood CLI commands https://telemetry.redwoodjs.com',
    })
    .option('yarn1', {
      default: false,
      type: 'boolean',
      describe: 'Use yarn 1. yarn 3 by default',
    })
    .option('git-init', {
      alias: 'git',
      default: null,
      type: 'boolean',
      describe: 'Initialize a new git repository.',
    })
    .option('language-target', {
      alias: 'language',
      choices: ['ts', 'ts-strict', 'js'],
      default: 'ts',
      type: 'string',
      describe: 'Choose your preferred development language.',
    })
    .version(version)
    .parse()

  // Variable to hold the user args as an object that can be used for prompt overides
  // This gets more useful as there are more prompts to override
  let userArgs = {}

  // Handle if a project name/path is specified in command line
  // E.g. yarn create redwood-app my-awesome-app
  if (typeof args[0] === 'string') {
    Object.assign(userArgs, {
      'project-name': args[0],
      'project-dir': args[0],
    })
  }

  // Handle if typescript is selected via --ts
  if (typescript === true) {
    Object.assign(userArgs, { typescript: true })
  }
  // Handle if typescript is skipped via --no-ts
  if (typescript === false) {
    Object.assign(userArgs, { typescript: false })
  }

  // Handle if git init is selected via --git-init
  if (gitInit === true) {
    Object.assign(userArgs, { 'git-init': true })
  }
  // Handle if git init is skipped via --no-git-init
  if (gitInit === false) {
    Object.assign(userArgs, { 'git-init': false })
  }

  // Check Node/Yarn/Engines Compatability
  // This checks all engine requirements, including Node.js and Yarn
  let hasPassedEngineCheck = null
  let engineErrorLog = []

  await new Listr(
    [
      {
        title: 'Checking node and yarn compatibility',
        skip: () => {
          if (yarnInstall === false) {
            return 'Warning: skipping check on request'
          }
        },
        task: () => {
          return new Promise((resolve) => {
            const { engines } = require(path.join(templateDir, 'package.json'))

            // this checks all engine requirements, including Node.js and Yarn
            checkNodeVersion(engines, (_error, result) => {
              if (result.isSatisfied) {
                hasPassedEngineCheck = true
                return resolve()
              }

              const logStatements = Object.keys(result.versions)
                .filter((name) => !result.versions[name].isSatisfied)
                .map((name) => {
                  const { version, wanted } = result.versions[name]
                  return style.error(
                    `${name} ${wanted} required, but you have ${version}`
                  )
                })
              engineErrorLog = [...logStatements]
              hasPassedEngineCheck = false
              return resolve()
            })
          })
        },
      },
    ],
    { clearOutput: true }
  ).run()

  // Show a success message if required engines are present
  if (hasPassedEngineCheck === true) {
    console.log(style.success(`✔️ Compatability checks passed.`))
  }

  // Show an error and prompt if failed engines
  if (hasPassedEngineCheck === false) {
    console.log(style.error(`✖️ Compatability checks failed.`))
    console.log(`${engineErrorLog.join('\n')}`)
    console.log(style.header(`\nVisit requirements documentation:`))
    console.log(
      style.warning(
        `/docs/tutorial/chapter1/prerequisites/#nodejs-and-yarn-versions\n`
      )
    )
    const response = await prompts({
      type: 'select',
      name: 'override-engine-error',
      message: 'How would you like to proceed?',
      choices: [
        { title: 'Override error and continue install', value: true },
        { title: 'Quit install', value: false },
      ],
      initial: 0,
    })
    if (response['override-engine-error'] === false) {
      process.exit(1)
    }
  }

  // User prompts
  // See https://github.com/terkelg/prompts
  const questions = [
    {
      type: 'text',
      name: 'project-name',
      message: 'Project name?',
      initial: 'my-redwood-app',
    },
    {
      type: 'text',
      name: 'project-dir',
      message: 'Project directory?',
      initial: (prev) => paramCase(prev),
    },
    {
      type: 'select',
      name: 'language-target',
      message: 'Choose your preferred development language.',
      choices: [
        { title: 'TypeScript', value: 'ts' },
        { title: 'TypeScript (strict mode)', value: 'ts-strict' },
        { title: 'JavaScript', value: 'js' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'git-init',
      message: 'Should we initialize a new git repository?',
      initial: true,
      active: 'Yes',
      inactive: 'No',
    },
  ]

  // Override prompts based on initial args from user
  prompts.override(userArgs)

  // Get the answers from the user
  const answers = await prompts(questions)

  // Get the directory for installation from the args
  // Because of the override we can just use the value from the answers which will
  // either be the overide or it will be the provided prompt.
  const targetDir = String(answers['project-dir']).replace(/,/g, '-')

  // Throw an error if there is no target directory specified
  if (!targetDir) {
    console.error('Please specify the project directory')
    console.log(
      `  ${chalk.cyan('yarn create redwood-app')} ${chalk.green(
        '<project-directory>'
      )}`
    )
    console.log()
    console.log('For example:')
    console.log(
      `  ${chalk.cyan('yarn create redwood-app')} ${chalk.green(
        'my-redwood-app'
      )}`
    )
    process.exit(1)
  }

  const newAppDir = path.resolve(process.cwd(), targetDir)
  const appDirExists = fs.existsSync(newAppDir)

  const createProjectTasks = ({ newAppDir, overwrite }) => {
    return [
      // {
      //   title: 'Checking node and yarn compatibility',
      //   skip: () => {
      //     if (yarnInstall === false) {
      //       return 'Warning: skipping check on request'
      //     }
      //   },
      //   task: () => {
      //     return new Promise((resolve, reject) => {
      //       const { engines } = require(path.join(templateDir, 'package.json'))

      //       // this checks all engine requirements, including Node.js and Yarn
      //       checkNodeVersion(engines, (_error, result) => {
      //         if (result.isSatisfied) {
      //           return resolve()
      //         }

      //         const logStatements = Object.keys(result.versions)
      //           .filter((name) => !result.versions[name].isSatisfied)
      //           .map((name) => {
      //             const { version, wanted } = result.versions[name]
      //             return style.error(
      //               `${name} ${wanted} required, but you have ${version}`
      //             )
      //           })
      //         logStatements.push(
      //           style.header(`\nVisit requirements documentation:`)
      //         )
      //         logStatements.push(
      //           style.warning(
      //             `/docs/tutorial/chapter1/prerequisites/#nodejs-and-yarn-versions\n`
      //           )
      //         )
      //         return reject(new Error(logStatements.join('\n')))
      //       })
      //     })
      //   },
      // },
      {
        title: `${
          appDirExists ? 'Using' : 'Creating'
        } directory '${newAppDir}'`,
        task: () => {
          if (appDirExists && !overwrite) {
            // make sure that the target directory is empty
            if (fs.readdirSync(newAppDir).length > 0) {
              console.error(
                style.error(
                  `\n'${newAppDir}' already exists and is not empty\n`
                )
              )
              process.exit(1)
            }
          } else {
            fs.ensureDirSync(path.dirname(newAppDir))
          }
          fs.copySync(templateDir, newAppDir, { overwrite: overwrite })
          // .gitignore is renamed here to force file inclusion during publishing
          fs.rename(
            path.join(newAppDir, 'gitignore.template'),
            path.join(newAppDir, '.gitignore')
          )
        },
      },
      {
        title: 'Converting to yarn 1',
        enabled: () => yarn1,
        task: () => {
          // rm files:
          // - .yarnrc.yml
          // - .yarn
          fs.rmSync(path.join(newAppDir, '.yarnrc.yml'))
          fs.rmdirSync(path.join(newAppDir, '.yarn'), { recursive: true })

          // rm after `.pnp.*`
          const gitignore = fs.readFileSync(
            path.join(newAppDir, '.gitignore'),
            {
              encoding: 'utf-8',
            }
          )
          const [yarn1Gitignore, _yarn3Gitignore] = gitignore.split('.pnp.*')
          fs.writeFileSync(path.join(newAppDir, '.gitignore'), yarn1Gitignore)

          // rm `packageManager` from package.json
          const packageJSON = fs.readJSONSync(
            path.join(newAppDir, 'package.json')
          )
          delete packageJSON.packageManager
          fs.writeJSONSync(path.join(newAppDir, 'package.json'), packageJSON, {
            spaces: 2,
          })
        },
      },
    ]
  }

  const installNodeModulesTasks = ({ newAppDir }) => {
    return [
      {
        title: "Running 'yarn install'... (This could take a while)",
        skip: () => {
          if (yarnInstall === false) {
            return 'skipped on request'
          }
        },
        task: () => {
          return execa('yarn install', {
            shell: true,
            cwd: newAppDir,
          })
        },
      },
    ]
  }

  const sendTelemetry = ({ error } = {}) => {
    // send 'create' telemetry event, or disable for new app
    if (telemetry) {
      const command = process.argv
      // make command show 'create redwood-app [path] --flags'
      command.splice(2, 0, 'create', 'redwood-app')
      command[4] = '[path]'

      let args = [
        '--root',
        newAppDir,
        '--argv',
        JSON.stringify(command),
        '--duration',
        Date.now() - startTime,
        '--rwVersion',
        version,
      ]
      if (error) {
        args = [...args, '--error', `"${error}"`]
      }

      spawn(process.execPath, [path.join(__dirname, 'telemetry.js'), ...args], {
        detached: process.env.REDWOOD_VERBOSE_TELEMETRY ? false : true,
        stdio: process.env.REDWOOD_VERBOSE_TELEMETRY ? 'inherit' : 'ignore',
      }).unref()
    } else {
      fs.appendFileSync(
        path.join(newAppDir, '.env'),
        'REDWOOD_DISABLE_TELEMETRY=1\n'
      )
    }
  }

  const startTime = Date.now()

  new Listr(
    [
      {
        title: 'Creating Redwood app',
        task: () => new Listr(createProjectTasks({ newAppDir, overwrite })),
      },
      {
        title: 'Installing packages',
        task: () => new Listr(installNodeModulesTasks({ newAppDir })),
      },
      {
        title: 'Convert TypeScript files to JavaScript',
        // Enabled if user selects javascript prompt
        // Enabled if user specified javascript via commandline
        enabled: () =>
          yarnInstall === true &&
          (languageTarget === 'js' || answers['language-target'] === 'js'),
        task: () => {
          return execa('yarn rw ts-to-js', {
            shell: true,
            cwd: newAppDir,
          })
        },
      },
      {
        title: 'Generating types',
        skip: () => yarnInstall === false,
        task: () => {
          return execa('yarn rw-gen', {
            shell: true,
            cwd: newAppDir,
          })
        },
      },
      // TODO this doesn't actually work
      {
        title: 'Enable TypeScript strict mode',

        enabled: () =>
          yarnInstall === true &&
          (languageTarget === 'ts-strict' ||
            answers['language-target'] === 'ts-strict'),
        task: () => {
          return console.log('TODO')
        },
      },
      {
        title: 'Initializing new git repo',
        enabled: () => gitInit === true || answers['git-init'] === true,
        task: () => {
          return execa(
            'git init && git add . && git commit -m "Initial commit" && git branch -M main',
            {
              shell: true,
              cwd: newAppDir,
            }
          )
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )
    .run()
    .then(() => {
      sendTelemetry()

      // zOMG the semicolon below is a real Prettier thing. What??
      // https://prettier.io/docs/en/rationale.html#semicolons
      ;[
        '',
        style.success(
          `🎉🎉Successfully created ${answers['project-name']}🎉🎉`
        ),
        style.success('Thanks for trying out Redwood!'),
        '',
        ` ⚡️ ${style.redwood(
          'Get up and running fast with this Quick Start guide'
        )}: https://redwoodjs.com/docs/quick-start`,
        '',
        style.header('Join the Community'),
        '',
        `${style.redwood(
          ' ❖ Join our Forums'
        )}: https://community.redwoodjs.com`,
        `${style.redwood(' ❖ Join our Chat')}: https://discord.gg/redwoodjs`,
        '',
        style.header('Get some help'),
        '',
        `${style.redwood(
          ' ❖ Get started with the Tutorial'
        )}: https://redwoodjs.com/docs/tutorial`,
        `${style.redwood(
          ' ❖ Read the Documentation'
        )}: https://redwoodjs.com/docs`,
        '',
        style.header('Stay updated'),
        '',
        `${style.redwood(
          ' ❖ Sign up for our Newsletter'
        )}: https://www.redwoodjs.com/newsletter`,
        `${style.redwood(
          ' ❖ Follow us on Twitter'
        )}: https://twitter.com/redwoodjs`,
        '',
        `${style.header(`Become a Contributor`)} ${style.love('❤')}`,
        '',
        `${style.redwood(
          ' ❖ Learn how to get started'
        )}: https://redwoodjs.com/docs/contributing`,
        `${style.redwood(
          ' ❖ Find a Good First Issue'
        )}: https://redwoodjs.com/good-first-issue`,
        '',
        `${style.header(`Fire it up!`)} 🚀`,
        '',
        `${style.redwood(` > ${style.green(`cd ${targetDir}`)}`)}`,
        `${style.redwood(` > ${style.green(`yarn rw dev`)}`)}`,
        '',
      ].map((item) => console.log(item))
    })
    .catch((e) => {
      console.log()
      console.log(e)
      sendTelemetry({ error: e.message })

      if (fs.existsSync(newAppDir)) {
        console.log(
          style.warning(`\nWarning: Directory `) +
            style.cmd(`'${newAppDir}' `) +
            style.warning(
              `was created. However, the installation could not complete due to an error.\n`
            )
        )
      }
      process.exit(1)
    })
})()
