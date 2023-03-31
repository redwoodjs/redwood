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

import { RedwoodTUI, styling } from '@redwoodjs/tui'

import { name, version } from '../package'

import {
  startTelemetry,
  shutdownTelemetry,
  recordErrorViaTelemetry,
} from './telemetry'

// Telemetry
const { telemetry } = Parser(hideBin(process.argv))

const tui = new RedwoodTUI()

async function checkCompatibility(templateDir, yarnInstall) {
  tui.setContentMode('text')
  tui.setHeader('Checking node and yarn compatibility', { spinner: true })

  if (!yarnInstall) {
    tui.setContent(
      ` ${styling.warning(
        '⚠ Warning'
      )}: Skipped check because yarn install was skipped with "--yarn-install false"`
    )
    tui.moveOn()
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
            return `${name} ${wanted} required, but you have ${version}`
          })
        return resolve([false, logStatements])
      })
    }
  )

  if (engineCheckPassed) {
    tui.setContent(' ✔ Compatibility checks passed')
    tui.moveOn()
    return
  }

  // TODO: Handle engine check errors
  if (!engineCheckPassed) {
    const engineCheckErrorDocs = terminalLink(
      'Tutorial - Prerequisites',
      'https://redwoodjs.com/docs/tutorial/chapter1/prerequisites'
    )
    tui.displayError(
      'Compatibility checks failed',
      [
        `  ${engineCheckErrors.join('\n')}`,
        '',
        `  This may make your project incompatible with some deploy targets.`,
        `  See: ${engineCheckErrorDocs}`,
      ].join('\n')
    )
    try {
      const response = await tui.prompt({
        type: 'select',
        name: 'override-engine-error',
        message: 'How would you like to proceed?',
        choices: ['Override error and continue install', 'Quit install'],
        initial: 0,
      })
      if (response['override-engine-error'] === 'Quit install') {
        recordErrorViaTelemetry('User quit after engine check error')
        await shutdownTelemetry()
        process.exit(1) // TODO: Should we use a different exit code?
      }
    } catch (error) {
      recordErrorViaTelemetry('User cancelled install at engine check error')
      await shutdownTelemetry()
      process.exit(1)
    }
  }
}

async function promptForTypescript() {
  tui.setContentMode('text')
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

async function promptForGit() {
  tui.setContentMode('text')
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

async function createProjectFiles(newAppDir, overwrite, yarn1) {
  // Check if the new app directory already exists
  if (fs.existsSync(newAppDir) && !overwrite) {
    // Check if the directory contains files and show an error if it does
    if (fs.readdirSync(newAppDir).length > 0) {
      tui.setBoxen({
        padding: 1,
        borderColor: 'red',
        title: '⚠ Project directory already contains files',
        titleAlignment: 'left',
      })
      tui.setContentMode('text')
      tui.setContent(
        [
          `'${styling.info(newAppDir)}' already exists and is not empty`,
          ``,
          `You can use the '${styling.info(
            'overwrite'
          )}' flag to create the project even if target directory isn't empty`,
        ].join('\n')
      )
      tui.disable()
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
}

async function installNodeModules(newAppDir) {
  tui.setContentMode('text')
  tui.setHeader('Installing node modules', { spinner: true })
  tui.setContent('  ⏱  This could take a minute or more...')

  const yarnInstallSubprocess = execa('yarn install', {
    shell: true,
    cwd: newAppDir,
  })

  try {
    // TODO: We didn't want to have the yarn output show up?
    // tui.setOutStream(yarnInstallSubprocess.stdout)
    // tui.setErrStream(yarnInstallSubprocess.stderr)
    await yarnInstallSubprocess
  } catch (error) {
    tui.displayError(
      "Couldn't install node modules",
      [
        `We could not install node modules via ${styling.info(
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

  tui.setHeader('Node modules successfully installed', { spinner: false })
  tui.setContent('')
  tui.moveOn()
}

async function convertToJavascript(newAppDir) {
  tui.setContentMode('text')
  tui.setHeader('Converting TypeScript files to JavaScript', { spinner: true })

  const conversionSubprocess = execa('yarn rw ts-to-js', {
    shell: true,
    cwd: newAppDir,
  })

  try {
    // TODO: We didn't want to have the yarn output show up?
    // tui.setOutStream(conversionSubprocess.stdout)
    // tui.setErrStream(conversionSubprocess.stderr)
    await conversionSubprocess
  } catch (error) {
    tui.displayError(
      "Couldn't convert TypeScript files to JavaScript",
      [
        `We could not convert the Typescript files to Javascript using ${styling.info(
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

  tui.setHeader('Converted TypeScript files to JavaScript', { spinner: false })
  tui.moveOn()
}

async function generateTypes(newAppDir) {
  tui.setContentMode('text')
  tui.setHeader('Generating types', { spinner: true })

  const generateSubprocess = execa('yarn rw-gen', {
    shell: true,
    cwd: newAppDir,
  })

  try {
    // TODO: We didn't want to have the yarn output show up?
    // tui.setOutStream(conversionSubprocess.stdout)
    // tui.setErrStream(conversionSubprocess.stderr)
    await generateSubprocess
  } catch (error) {
    tui.displayError(
      "Couldn't generate types",
      [
        `We could not generate types using ${styling.info(
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

  tui.setHeader('Generated types', { spinner: false })
  tui.moveOn()
}

async function initialiseGit(newAppDir) {
  tui.setContentMode('text')
  tui.setHeader('Initialising a git repo', { spinner: true })

  const gitSubprocess = execa(
    'git init && git add . && git commit -m "Initial commit"',
    {
      shell: true,
      cwd: newAppDir,
    }
  )

  try {
    // TODO: We didn't want to have the yarn output show up?
    // tui.setOutStream(conversionSubprocess.stdout)
    // tui.setErrStream(conversionSubprocess.stderr)
    await gitSubprocess
  } catch (error) {
    tui.displayError(
      "Couldn't initialise a git repo",
      [
        `We could not initialise a git repo using ${styling.info(
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

  tui.setHeader('Initialied a git repo', { spinner: false })
  tui.moveOn()
}

/**
 * This function creates a new RedwoodJS app.
 *
 * It performs the following actions:
 *  - TODO - Add a list of what this function does
 */
async function createRedwoodApp() {
  tui.enable()

  // Introductory message
  tui.drawLinesAndMoveOn(
    `${styling.redwood('-'.repeat(66))}`,
    `${' '.repeat(16)}🌲⚡️ ${styling.header('Welcome to RedwoodJS!')} ⚡️🌲`,
    `${styling.redwood('-'.repeat(66))}`
  )

  // Extract the args as provided by the user in the command line
  const {
    _: args,
    'yarn-install': yarnInstall,
    typescript,
    overwrite,
    // telemetry, // Extracted above to check if telemetry is disabled before we even reach this point
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
  trace.getActiveSpan().setAttribute('yarn-install', yarnInstall)
  trace.getActiveSpan().setAttribute('overwrite', overwrite)
  trace.getActiveSpan().setAttribute('yarn1', yarn1)

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
  await checkCompatibility(templateDir, yarnInstall)

  // Determine ts/js preference
  const useTypescript =
    typescript === null ? await promptForTypescript() : typescript
  trace.getActiveSpan().setAttribute('typescript', useTypescript)

  // Determine git preference
  const useGit = gitInit === null ? await promptForGit() : gitInit
  trace.getActiveSpan().setAttribute('git', useGit)

  // Create project files
  await createProjectFiles(newAppDir, overwrite, yarn1)

  // Install the node packages
  if (yarnInstall) {
    const yarnInstallStart = Date.now()
    await installNodeModules(newAppDir)
    trace
      .getActiveSpan()
      .setAttribute('yarn-install-time', Date.now() - yarnInstallStart)
  } else {
    tui.setContentMode('text')
    tui.setContent('Skipping yarn install')
    trace.getActiveSpan().setAttribute('yarn-install-time', 0)
  }

  // Conditionally convert to javascript
  if (!useTypescript && yarnInstall) {
    await convertToJavascript(newAppDir)
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
  tui.drawLinesAndMoveOn(
    '',
    styling.success('Thanks for trying out Redwood!'),
    '',
    ` ⚡️ ${styling.redwood(
      'Get up and running fast with this Quick Start guide'
    )}: https://redwoodjs.com/docs/quick-start`,
    '',
    styling.header('Join the Community'),
    '',
    `${styling.redwood(' ❖ Join our Forums')}: https://community.redwoodjs.com`,
    `${styling.redwood(' ❖ Join our Chat')}: https://discord.gg/redwoodjs`,
    '',
    styling.header('Get some help'),
    '',
    `${styling.redwood(
      ' ❖ Get started with the Tutorial'
    )}: https://redwoodjs.com/docs/tutorial`,
    `${styling.redwood(
      ' ❖ Read the Documentation'
    )}: https://redwoodjs.com/docs`,
    '',
    styling.header('Stay updated'),
    '',
    `${styling.redwood(
      ' ❖ Sign up for our Newsletter'
    )}: https://www.redwoodjs.com/newsletter`,
    `${styling.redwood(
      ' ❖ Follow us on Twitter'
    )}: https://twitter.com/redwoodjs`,
    '',
    `${styling.header(`Become a Contributor`)} ${styling.love('❤')}`,
    '',
    `${styling.redwood(
      ' ❖ Learn how to get started'
    )}: https://redwoodjs.com/docs/contributing`,
    `${styling.redwood(
      ' ❖ Find a Good First Issue'
    )}: https://redwoodjs.com/good-first-issue`,
    '',
    `${styling.header(`Fire it up!`)} 🚀`,
    '',
    `${styling.redwood(` > ${styling.green(`cd ${targetDir}`)}`)}`,
    `${styling.redwood(` > ${styling.green(`yarn rw dev`)}`)}`,
    ''
  )

  tui.disable()
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
    span.setStatus({ code: SpanStatusCode.OK })
    span.end()
  })

  // Shutdown telemetry, ensures data is sent before the process exits
  try {
    await shutdownTelemetry()
  } catch (error) {
    console.error('Telemetry shutdown error')
    console.error(error)
  }
})()
