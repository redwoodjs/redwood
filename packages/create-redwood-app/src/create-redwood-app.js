#!/usr/bin/env node

// This downloads the latest release of Redwood from https://github.com/redwoodjs/create-redwood-app/
// and extracts it into the supplied directory.
//
// Usage:
// `$ yarn create redwood-app ./path/to/new-project`

// import { spawn } from 'child_process'
import path from 'path'

import { trace, SpanStatusCode } from '@opentelemetry/api'
import chalk from 'chalk'
import checkNodeVersion from 'check-node-version'
import execa from 'execa'
import fs from 'fs-extra'
import terminalLink from 'terminal-link'
import { hideBin, Parser } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { RedwoodTUI, ReactiveTUIContent, RedwoodStyling } from '@redwoodjs/tui'

import { name, version } from '../package'

import {
  startTelemetry,
  shutdownTelemetry,
  recordErrorViaTelemetry,
} from './telemetry'

// Telemetry
const { telemetry } = Parser(hideBin(process.argv))

const tui = new RedwoodTUI()

async function executeCompatibilityCheck(templateDir, yarnInstall) {
  const tuiContent = new ReactiveTUIContent({
    mode: 'text',
    content: 'Checking node and yarn compatibility',
    spinner: {
      enabled: true,
    },
  })
  tui.startReactive(tuiContent)

  if (!yarnInstall) {
    tuiContent.update({
      spinner: {
        enabled: false,
      },
      content: `${RedwoodStyling.warning(
        '⚠'
      )} Skipped compatibility check because yarn install was skipped via command line flag`,
    })
    tui.stopReactive()
    return
  }

  const [engineCheckPassed, engineCheckErrors] = await new Promise(
    (resolve) => {
      const { engines } = require(path.join(templateDir, 'package.json'))

      // this checks all engine requirements, including Node.js and Yarn
      checkNodeVersion(engines, (_error, result) => {
        if (result.isSatisfied) {
          return resolve([true, []])
        }
        const logStatements = Object.keys(result.versions)
          .filter((name) => !result.versions[name].isSatisfied)
          .map((name) => {
            const { version, wanted } = result.versions[name]
            return `${name} ${wanted} required; found ${version}`
          })
        return resolve([false, logStatements])
      })
    }
  )

  if (engineCheckPassed) {
    tuiContent.update({
      spinner: {
        enabled: false,
      },
      content: `${RedwoodStyling.green('✔')} Compatibility checks passed`,
    })
    tui.stopReactive()
    return
  }

  if (!engineCheckPassed) {
    tui.stopReactive(true)
    tui.displayError(
      'Compatibility checks failed',
      [
        `  ${engineCheckErrors.join('\n')}`,
        '',
        `  Please use tools like nvm or corepack to change to a compatible version.`,
        `  See: ${terminalLink(
          'Tutorial - Prerequisites',
          'https://redwoodjs.com/docs/tutorial/chapter1/prerequisites'
        )}`,
      ].join('\n')
    )

    recordErrorViaTelemetry('Compatibility checks failed')
    await shutdownTelemetry()
    process.exit(1)
  }
}

async function createProjectFiles(newAppDir, overwrite, yarn1) {
  const tuiContent = new ReactiveTUIContent({
    mode: 'text',
    content: 'Creating project files',
    spinner: {
      enabled: true,
    },
  })
  tui.startReactive(tuiContent)

  // Check if the new app directory already exists
  if (fs.existsSync(newAppDir) && !overwrite) {
    // Check if the directory contains files and show an error if it does
    if (fs.readdirSync(newAppDir).length > 0) {
      tui.stopReactive(true)
      tui.displayError(
        'Project directory already contains files',
        [
          `'${RedwoodStyling.info(newAppDir)}' already exists and is not empty`,
          ``,
          `You can use the '${RedwoodStyling.info(
            'overwrite'
          )}' flag to create the project even if target directory isn't empty`,
        ].join('\n')
      )
      recordErrorViaTelemetry(`Project directory already contains files`)
      await shutdownTelemetry()
      process.exit(1)
    }
  }

  // Ensure the new app directory exists
  fs.ensureDirSync(path.dirname(newAppDir))

  // Copy the template files to the new app directory
  const templateDirectory = path.resolve(__dirname, '../template')
  fs.copySync(templateDirectory, newAppDir, { overwrite })

  // .gitignore is renamed here to force file inclusion during publishing
  fs.rename(
    path.join(newAppDir, 'gitignore.template'),
    path.join(newAppDir, '.gitignore')
  )

  // We need to update some files when the user selects to use yarn v1
  if (yarn1) {
    // rm files:
    // - .yarnrc.yml
    // - .yarn
    fs.rmSync(path.join(newAppDir, '.yarnrc.yml'))
    fs.rmSync(path.join(newAppDir, '.yarn'), {
      recursive: true,
      force: true,
    })

    // rm after `.pnp.*`
    const gitignore = fs.readFileSync(path.join(newAppDir, '.gitignore'), {
      encoding: 'utf-8',
    })
    const [yarn1Gitignore, _yarn3Gitignore] = gitignore.split('.pnp.*')
    fs.writeFileSync(path.join(newAppDir, '.gitignore'), yarn1Gitignore)

    // rm `packageManager` from package.json
    const packageJSON = fs.readJSONSync(path.join(newAppDir, 'package.json'))
    delete packageJSON.packageManager
    fs.writeJSONSync(path.join(newAppDir, 'package.json'), packageJSON, {
      spaces: 2,
    })
  }

  tuiContent.update({
    spinner: {
      enabled: false,
    },
    content: `${RedwoodStyling.green('✔')} Project files created`,
  })
  tui.stopReactive()
}

async function installNodeModules(newAppDir) {
  const tuiContent = new ReactiveTUIContent({
    mode: 'text',
    header: 'Installing node modules',
    content: '  ⏱  This could take a while...',
    spinner: {
      enabled: true,
    },
  })
  tui.startReactive(tuiContent)

  const yarnInstallSubprocess = execa('yarn install', {
    shell: true,
    cwd: newAppDir,
  })

  try {
    await yarnInstallSubprocess
  } catch (error) {
    tui.stopReactive(true)
    tui.displayError(
      "Couldn't install node modules",
      [
        `We could not install node modules via ${RedwoodStyling.info(
          "'yarn install'"
        )}. Please see below for the full error message.`,
        '',
        error,
      ].join('\n')
    )
    recordErrorViaTelemetry(error)
    await shutdownTelemetry()
    process.exit(1)
  }

  tuiContent.update({
    header: '',
    content: `${RedwoodStyling.green('✔')} Node modules successfully installed`,
    spinner: {
      enabled: false,
    },
  })
  tui.stopReactive()
}

async function convertToJavascript(newAppDir) {
  const tuiContent = new ReactiveTUIContent({
    mode: 'text',
    content: 'Converting TypeScript files to JavaScript',
    spinner: {
      enabled: true,
    },
  })
  tui.startReactive(tuiContent)

  const conversionSubprocess = execa('yarn rw ts-to-js', {
    shell: true,
    cwd: newAppDir,
  })

  try {
    await conversionSubprocess
  } catch (error) {
    tui.stopReactive(true)
    tui.displayError(
      "Couldn't convert TypeScript files to JavaScript",
      [
        `We could not convert the Typescript files to Javascript using ${RedwoodStyling.info(
          "'yarn rw ts-to-js'"
        )}. Please see below for the full error message.`,
        '',
        error,
      ].join('\n')
    )
    recordErrorViaTelemetry(error)
    await shutdownTelemetry()
    process.exit(1)
  }

  tuiContent.update({
    content: `${RedwoodStyling.green(
      '✔'
    )} Converted TypeScript files to JavaScript`,
    spinner: {
      enabled: false,
    },
  })
  tui.stopReactive()
}

async function generateTypes(newAppDir) {
  const tuiContent = new ReactiveTUIContent({
    mode: 'text',
    content: 'Generating types',
    spinner: {
      enabled: true,
    },
  })
  tui.startReactive(tuiContent)

  const generateSubprocess = execa('yarn rw-gen', {
    shell: true,
    cwd: newAppDir,
  })

  try {
    await generateSubprocess
  } catch (error) {
    tui.stopReactive(true)
    tui.displayError(
      "Couldn't generate types",
      [
        `We could not generate types using ${RedwoodStyling.info(
          "'yarn rw-gen'"
        )}. Please see below for the full error message.`,
        '',
        error,
      ].join('\n')
    )
    recordErrorViaTelemetry(error)
    await shutdownTelemetry()
    process.exit(1)
  }

  tuiContent.update({
    content: `${RedwoodStyling.green('✔')} Generated types`,
    spinner: {
      enabled: false,
    },
  })
  tui.stopReactive()
}

async function initialiseGit(newAppDir) {
  const tuiContent = new ReactiveTUIContent({
    mode: 'text',
    content: 'Initialising a git repo',
    spinner: {
      enabled: true,
    },
  })
  tui.startReactive(tuiContent)

  const gitSubprocess = execa(
    'git init && git add . && git commit -m "Initial commit"',
    {
      shell: true,
      cwd: newAppDir,
    }
  )

  try {
    await gitSubprocess
  } catch (error) {
    tui.stopReactive(true)
    tui.displayError(
      "Couldn't initialise a git repo",
      [
        `We could not initialise a git repo using ${RedwoodStyling.info(
          'git init && git add . && git commit -m "Initial commit"'
        )}. Please see below for the full error message.`,
        '',
        error,
      ].join('\n')
    )
    recordErrorViaTelemetry(error)
    await shutdownTelemetry()
    process.exit(1)
  }

  tuiContent.update({
    content: `${RedwoodStyling.green('✔')} Initialised a git repo`,
    spinner: {
      enabled: false,
    },
  })
  tui.stopReactive()
}

async function handleTypescriptPreference(typescriptFlag) {
  // Handle case where flag is set
  if (typescriptFlag !== null) {
    tui.drawText(
      `${RedwoodStyling.green('✔')} Using ${
        typescriptFlag ? 'TypeScript' : 'JavaScript'
      } based on command line flag`
    )
    return typescriptFlag
  }

  // Prompt user for preference
  try {
    const response = await tui.prompt({
      type: 'Select',
      name: 'language',
      choices: ['TypeScript', 'JavaScript'],
      message: 'Select your preferred coding language',
      initial: 'TypeScript',
    })
    return response.language === 'TypeScript'
  } catch (_error) {
    recordErrorViaTelemetry('User cancelled install at language prompt')
    await shutdownTelemetry()
    process.exit(1)
  }
}

async function handleGitPreference(gitInitFlag) {
  // Handle case where flag is set
  if (gitInitFlag !== null) {
    tui.drawText(
      `${RedwoodStyling.green('✔')} ${
        gitInitFlag ? 'Will' : 'Will not'
      } initialise a git repo based on command line flag`
    )
    return gitInitFlag
  }

  // Prompt user for preference
  try {
    const response = await tui.prompt({
      type: 'Toggle',
      name: 'git',
      message: 'Do you want to initialize a git repo?',
      enabled: 'Yes',
      disabled: 'no',
      initial: 'Yes',
    })
    return response.git
  } catch (_error) {
    recordErrorViaTelemetry('User cancelled install at git prompt')
    await shutdownTelemetry()
    process.exit(1)
  }
}

/**
 * This function creates a new RedwoodJS app.
 *
 * It performs the following actions:
 *  - TODO - Add a list of what this function does
 */
async function createRedwoodApp() {
  // Introductory message
  tui.drawText(
    [
      `${RedwoodStyling.redwood('-'.repeat(66))}`,
      `${' '.repeat(16)}🌲⚡️ ${RedwoodStyling.header(
        'Welcome to RedwoodJS!'
      )} ⚡️🌲`,
      `${RedwoodStyling.redwood('-'.repeat(66))}`,
    ].join('\n')
  )

  // Extract the args as provided by the user in the command line
  // TODO: Make all flags have the 'flag' suffix
  const {
    _: args,
    'yarn-install': yarnInstall,
    typescript: typescriptFlag,
    overwrite,
    // telemetry, // Extracted above to check if telemetry is disabled before we even reach this point
    yarn1,
    'git-init': gitInitFlag,
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
      describe: 'Initialize a git repository.',
    })
    .version(version)
    .parse()

  // Record some of the arguments for telemetry
  trace.getActiveSpan()?.setAttribute('yarn-install', yarnInstall)
  trace.getActiveSpan()?.setAttribute('overwrite', overwrite)
  trace.getActiveSpan()?.setAttribute('yarn1', yarn1)

  // Get the directory for installation from the args
  const targetDir = String(args).replace(/,/g, '-')

  // Throw an error if there is no target directory specified
  if (!targetDir) {
    tui.displayError(
      'No target directory specified',
      [
        'Please specify the project directory',
        `  ${chalk.cyan('yarn create redwood-app')} ${chalk.green(
          '<project-directory>'
        )}`,
        '',
        'For example:',
        `  ${chalk.cyan('yarn create redwood-app')} ${chalk.green(
          'my-redwood-app'
        )}`,
      ].join('\n')
    )
    recordErrorViaTelemetry('No target directory specified')
    await shutdownTelemetry()
    process.exit(1)
  }

  const newAppDir = path.resolve(process.cwd(), targetDir)
  const templateDir = path.resolve(__dirname, '../template')

  // Engine check
  await executeCompatibilityCheck(templateDir, yarnInstall)

  // Determine ts/js preference
  const useTypescript = await handleTypescriptPreference(typescriptFlag)
  trace.getActiveSpan()?.setAttribute('typescript', useTypescript)

  // Determine git preference
  const useGit = await handleGitPreference(gitInitFlag)
  trace.getActiveSpan()?.setAttribute('git', useGit)

  // Create project files
  await createProjectFiles(newAppDir, overwrite, yarn1)

  // Install the node packages
  if (yarnInstall) {
    const yarnInstallStart = Date.now()
    await installNodeModules(newAppDir)
    trace
      .getActiveSpan()
      ?.setAttribute('yarn-install-time', Date.now() - yarnInstallStart)
  } else {
    tui.drawText(
      `${RedwoodStyling.warning(
        '⚠'
      )} Skipped yarn install step based on command line flag`
    )
  }

  // Conditionally convert to javascript
  if (!useTypescript) {
    if (yarnInstall) {
      await convertToJavascript(newAppDir)
    } else {
      tui.drawText(
        [
          `${RedwoodStyling.warning(
            '⚠'
          )} Unable to convert to javascript without yarn install step`,
          '  Please run the following command inside your project once yarn install has been executed:',
          `  ${RedwoodStyling.info("'yarn rw ts-to-js'")}`,
        ].join('\n')
      )
    }
  }

  // Generate types
  if (yarnInstall) {
    await generateTypes(newAppDir)
  }

  // Initialise git repo
  if (useGit) {
    await initialiseGit(newAppDir)
  }

  // Post install message
  tui.drawText(
    [
      '',
      RedwoodStyling.success('Thanks for trying out Redwood!'),
      '',
      ` ⚡️ ${RedwoodStyling.redwood(
        'Get up and running fast with this Quick Start guide'
      )}: https://redwoodjs.com/docs/quick-start`,
      '',
      RedwoodStyling.header('Join the Community'),
      '',
      `${RedwoodStyling.redwood(
        ' ❖ Join our Forums'
      )}: https://community.redwoodjs.com`,
      `${RedwoodStyling.redwood(
        ' ❖ Join our Chat'
      )}: https://discord.gg/redwoodjs`,
      '',
      RedwoodStyling.header('Get some help'),
      '',
      `${RedwoodStyling.redwood(
        ' ❖ Get started with the Tutorial'
      )}: https://redwoodjs.com/docs/tutorial`,
      `${RedwoodStyling.redwood(
        ' ❖ Read the Documentation'
      )}: https://redwoodjs.com/docs`,
      '',
      RedwoodStyling.header('Stay updated'),
      '',
      `${RedwoodStyling.redwood(
        ' ❖ Sign up for our Newsletter'
      )}: https://www.redwoodjs.com/newsletter`,
      `${RedwoodStyling.redwood(
        ' ❖ Follow us on Twitter'
      )}: https://twitter.com/redwoodjs`,
      '',
      `${RedwoodStyling.header(`Become a Contributor`)} ${RedwoodStyling.love(
        '❤'
      )}`,
      '',
      `${RedwoodStyling.redwood(
        ' ❖ Learn how to get started'
      )}: https://redwoodjs.com/docs/contributing`,
      `${RedwoodStyling.redwood(
        ' ❖ Find a Good First Issue'
      )}: https://redwoodjs.com/good-first-issue`,
      '',
      `${RedwoodStyling.header(`Fire it up!`)} 🚀`,
      '',
      `${RedwoodStyling.redwood(
        ` > ${RedwoodStyling.green(`cd ${targetDir}`)}`
      )}`,
      `${RedwoodStyling.redwood(` > ${RedwoodStyling.green(`yarn rw dev`)}`)}`,
      '',
    ].join('\n')
  )
}

;(async () => {
  // Conditionally start telemetry
  if (telemetry !== 'false' && !process.env.REDWOOD_DISABLE_TELEMETRY) {
    try {
      await startTelemetry()
    } catch (error) {
      console.error('Telemetry startup error')
      console.error(error)
    }
  }

  // Execute create redwood app within a span
  const tracer = trace.getTracer('redwoodjs')
  await tracer.startActiveSpan('create-redwood-app', async (span) => {
    await createRedwoodApp()

    // Span housekeeping
    span?.setStatus({ code: SpanStatusCode.OK })
    span?.end()
  })

  // Shutdown telemetry, ensures data is sent before the process exits
  try {
    await shutdownTelemetry()
  } catch (error) {
    console.error('Telemetry shutdown error')
    console.error(error)
  }
})()
