#!/usr/bin/env node

// This downloads the latest release of Redwood from https://github.com/redwoodjs/create-redwood-app/
// and extracts it into the supplied directory.
//
// Usage:
// `$ yarn create redwood-app ./path/to/new-project`

import path from 'path'

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
import chalk from 'chalk'
import checkNodeVersion from 'check-node-version'
import { prompt } from 'enquirer'
import execa from 'execa'
import fs from 'fs-extra'
import { Listr, figures } from 'listr2'
import terminalLink from 'terminal-link'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { name, version } from '../package'

import { startTelemetry, shutdownTelemetry } from './telemetry'
;(async () => {
  //

  // Telemetry
  if (
    !process.argv.includes('--no-telemetry') && // Must include '--no-telemetry' exactly because we want to do this check before any yargs. TODO: Communicate this on cmd help
    !process.env.REDWOOD_DISABLE_TELEMETRY // We should use the same condition as in full projects here too
  ) {
    // Setup and start root span
    await startTelemetry()
  }

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

  // Extract the args as provided by the user in the command line
  const {
    _: args,
    'yarn-install': yarnInstall,
    typescript,
    overwrite,
    yarn1,
    'git-init': gitInit,
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
    .option('yarn1', {
      default: false,
      type: 'boolean',
      describe: 'Use yarn 1. yarn 3 by default',
    })
    .option('git-init', {
      alias: 'git',
      default: null,
      type: 'boolean',
      describe: 'Initialize a git repository.',
    })
    .version(version)
    .parse()

  // Get the directory for installation from the args
  const targetDir = String(args).replace(/,/g, '-')

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
    await shutdownTelemetry({
      exception: new Error('no target directory specified'),
    })
    process.exit(1)
  }

  const newAppDir = path.resolve(process.cwd(), targetDir)
  const appDirExists = fs.existsSync(newAppDir)
  const templateDir = path.resolve(__dirname, '../template')

  const createProjectTasks = ({ newAppDir, overwrite }) => {
    return [
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
              shutdownTelemetry({
                exception: new Error('target directory not empty'),
              }).finally(() => process.exit(1))
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
          fs.rmSync(path.join(newAppDir, '.yarn'), {
            recursive: true,
            force: true,
          })

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

  // Engine check Listr. Separate Listr to avoid https://github.com/cenk1cenk2/listr2/issues/296
  // Boolean flag
  let hasPassedEngineCheck = null
  // Array of strings
  let engineErrorLog = []
  // Docs link for engine errors
  const engineErrorDocsLink = terminalLink(
    'Tutorial - Prerequisites',
    'https://redwoodjs.com/docs/tutorial/chapter1/prerequisites'
  )

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
                  return `${name} ${wanted} required, but you have ${version}`
                })
              engineErrorLog = logStatements
              hasPassedEngineCheck = false
              return resolve()
            })
          })
        },
      },
    ],
    { rendererOptions: { clearOutput: true } }
  ).run()

  // Show a success message if required engines are present
  if (hasPassedEngineCheck === true) {
    console.log(`${style.success(figures.tick)} Compatibility checks passed`)
  }

  // Show an error and prompt if failed engines check
  if (hasPassedEngineCheck === false) {
    console.log(`${style.error(figures.cross)} Compatibility checks failed`)
    console.log(
      [
        `  ${style.warning(figures.warning)} ${engineErrorLog.join('\n')}`,
        '',
        `    This may make your project incompatible with some deploy targets.`,
        `    See: ${engineErrorDocsLink}`,
        '',
      ].join('\n')
    )
    // Prompt user for how to proceed
    const response = await prompt({
      type: 'select',
      name: 'override-engine-error',
      message: 'How would you like to proceed?',
      choices: ['Override error and continue install', 'Quit install'],
      initial: 0,
      onCancel: async () => {
        await shutdownTelemetry({
          exception: new Error('cancelled engine override'),
        })
        process.exit(1)
      },
    })
    // Quit the install if user selects this option, otherwise it will proceed
    if (response['override-engine-error'] === 'Quit install') {
      await shutdownTelemetry({
        exception: new Error('quit install at engine override'),
      })
      process.exit(1)
    }
  }

  // Main install Listr
  new Listr(
    [
      {
        title: 'Language preference',
        skip: () => typescript !== null,
        task: async (ctx, task) => {
          ctx.language = await task.prompt({
            type: 'Select',
            choices: ['TypeScript', 'JavaScript'],
            message: 'Select your preferred coding language',
            initial: 'TypeScript',
          })
          task.output = ctx.language
          // Error code and exit if someone has disabled yarn install but selected JavaScript
          if (!yarnInstall && ctx.language === 'JavaScript') {
            throw new Error(
              'JavaScript transpilation requires running yarn install. Please rerun create-redwood-app without disabling yarn install.'
            )
          }
        },
        options: {
          persistentOutput: true,
        },
      },
      {
        title: 'Git preference',
        skip: () => gitInit !== null,
        task: async (ctx, task) => {
          ctx.gitInit = await task.prompt({
            type: 'Toggle',
            message: 'Do you want to initialize a git repo?',
            enabled: 'Yes',
            disabled: 'no',
            initial: 'Yes',
          })
          task.output = ctx.gitInit ? 'Initialize a git repo' : 'Skip'
        },
        options: {
          persistentOutput: true,
        },
      },
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
        // Enabled if user selects no to typescript prompt
        // Enabled if user specified --no-ts via command line
        enabled: (ctx) =>
          yarnInstall === true &&
          (typescript === false || ctx.language === 'JavaScript'),
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
      {
        title: 'Initializing a git repo',
        enabled: (ctx) => gitInit || ctx.gitInit,
        task: () => {
          return execa(
            'git init && git add . && git commit -m "Initial commit"',
            {
              shell: true,
              cwd: newAppDir,
            }
          )
        },
      },
    ],
    {
      rendererOptions: { collapse: false },
      exitOnError: true,
    }
  )
    .run()
    .then(() => {
      // zOMG the semicolon below is a real Prettier thing. What??
      // https://prettier.io/docs/en/rationale.html#semicolons
      ;[
        '',
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
      shutdownTelemetry().then(() => {
        process.exit(0)
      })
    })
    .catch((e) => {
      console.log()
      console.log(e)

      if (fs.existsSync(newAppDir)) {
        console.log(
          style.warning(`\nWarning: Directory `) +
            style.cmd(`'${newAppDir}' `) +
            style.warning(
              `was created. However, the installation could not complete due to an error.\n`
            )
        )
      }
      shutdownTelemetry({ exception: e }).finally(() => process.exit(1))
    })
})()
