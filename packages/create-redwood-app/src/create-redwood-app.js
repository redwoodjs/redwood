#!/usr/bin/env node

// This downloads the latest release of Redwood from https://github.com/redwoodjs/create-redwood-app/
// and extracts it into the supplied directory.
//
// Usage:
// `$ yarn create redwood-app ./path/to/new-project`

import fs from 'fs'
import path from 'path'

import decompress from 'decompress'
import axios from 'axios'
import Listr from 'listr'
import execa from 'execa'
import tmp from 'tmp'
import checkNodeVersion from 'check-node-version'
import chalk from 'chalk'
import yargs from 'yargs'

import { name, version } from '../package'

const RELEASE_URL =
  'https://api.github.com/repos/redwoodjs/create-redwood-app/releases/latest'

const latestReleaseZipFile = async () => {
  const response = await axios.get(RELEASE_URL)
  return response.data.zipball_url
}

const downloadFile = async (sourceUrl, targetFile) => {
  const writer = fs.createWriteStream(targetFile)
  const response = await axios.get(sourceUrl, {
    responseType: 'stream',
  })
  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

const { _: args, 'yarn-install': yarnInstall } = yargs
  .scriptName(name)
  .usage('Usage: $0 <project directory> [option]')
  .example('$0 newapp')
  .option('yarn-install', {
    default: true,
    describe: 'Skip yarn install with --no-yarn-install',
  })
  .version(version)
  .strict().argv

const targetDir = String(args).replace(/,/g, '-')
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

if (appDirExists && fs.readdirSync(newAppDir).length > 0) {
  console.error(`'${newAppDir}' already exists and is not empty.`)
  process.exit(1)
}

const createProjectTasks = ({ newAppDir }) => {
  const tmpDownloadPath = tmp.tmpNameSync({
    prefix: 'redwood',
    postfix: '.zip',
  })

  return [
    {
      title: `${appDirExists ? 'Using' : 'Creating'} directory '${newAppDir}'`,
      task: () => {
        fs.mkdirSync(newAppDir, { recursive: true })
      },
    },
    {
      title: 'Downloading latest release',
      task: async () => {
        const url = await latestReleaseZipFile()
        return downloadFile(url, tmpDownloadPath)
      },
    },
    {
      title: 'Extracting latest release',
      task: () => decompress(tmpDownloadPath, newAppDir, { strip: 1 }),
    },
    {
      title: 'Clean up',
      task: () => {
        try {
          fs.unlinkSync(path.join(newAppDir, 'README.md'))
          fs.renameSync(
            path.join(newAppDir, 'README_APP.md'),
            path.join(newAppDir, 'README.md')
          )

          fs.unlinkSync(path.join(newAppDir, '.gitignore'))
          fs.renameSync(
            path.join(newAppDir, '.gitignore.app'),
            path.join(newAppDir, '.gitignore')
          )
        } catch (e) {
          throw new Error('Could not move project files')
        }
      },
    },
  ]
}

const installNodeModulesTasks = ({ newAppDir }) => {
  return [
    {
      title: 'Checking node and yarn compatibility',
      task: () => {
        return new Promise((resolve, reject) => {
          const { engines } = require(path.join(newAppDir, 'package.json'))

          checkNodeVersion(engines, (_error, result) => {
            if (result.isSatisfied) {
              return resolve()
            }

            const errors = Object.keys(result.versions).map((name) => {
              const { version, wanted } = result.versions[name]
              return `${name} ${wanted} required, but you have ${version}.`
            })
            return reject(new Error(errors.join('\n')))
          })
        })
      },
    },
    {
      title: 'Running `yarn install`... (This could take a while)',
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

const displaySuccessMessage = () => {
  const items = displaySuccessMessageItems

  return Object.keys(items).forEach((key) => {
    const section = items[key]

    if (section.header) {
      console.log(`\n${section.header}\n`)
    }

    section.rows.forEach((row) => {
      const text = row.text
      const url = typeof row.url !== 'undefined' ? `: ${row.url}` : ''

      console.log(`${text}${url}`)
    })
  })
}

// Inspiration from from @redwood/cli
// https://github.com/redwoodjs/redwood/blob/main/packages/cli/src/lib/colors.js
const style = {
  error: chalk.bold.red,
  warning: chalk.keyword('orange'),
  success: chalk.hex('#c3e88d'),
  info: chalk.grey,
  header: chalk.bold.underline.hex('##e8e8e8'),
  cmd: chalk.hex('#808080'),
  redwood: chalk.hex('#ff845e'),
  love: chalk.reset.hex('#de1d10'),
}

const displaySuccessMessageItems = {
  start: {
    header: style.success('Thanks for trying out Redwood!'),
    rows: [
      {
        text: `We've created your app in '${style.cmd(newAppDir)}'`,
      },
      {
        text: `Enter the directory and run '${style.cmd(
          'yarn rw dev'
        )}' to start the development server.`,
      },
    ],
  },
  help: {
    header: style.header('Join the Community and Get Help'),
    rows: [
      {
        text: style.redwood(' ⮡  Join our Forums'),
        url: 'https://community.redwoodjs.com',
      },
      {
        text: style.redwood(' ⮡  Join our Chat'),
        url: 'https://discord.gg/redwoodjs',
      },
      {
        text: style.redwood(' ⮡  Read the Documentation'),
        url: 'https://redwoodjs.com/docs/',
      },
    ],
  },
  updated: {
    header: style.header('Keep updated'),
    rows: [
      {
        text: style.redwood(' ⮡  Newsletter signup'),
        url: 'https://www.redwoodjs.com',
      },
      {
        text: style.redwood(' ⮡  Follow on Twitter'),
        url: 'https://twitter.com/redwoodjs',
      },
    ],
  },
  contribute: {
    header: `${style.header(`Become a Contributor`)} ${style.love('❤')}`,
    rows: [
      {
        text: style.redwood(' ⮡  Learn how to get started'),
        url: 'https://redwoodjs.com/docs/contributing',
      },
      {
        text: style.redwood(' ⮡  Find a Good First Issue'),
        url: 'https://redwoodjs.com/good-first-issue',
      }
    ],
  },
}

new Listr(
  [
    {
      title: 'Creating Redwood app',
      task: () => new Listr(createProjectTasks({ newAppDir })),
    },
    {
      title: 'Installing packages',
      task: () => new Listr(installNodeModulesTasks({ newAppDir })),
    },
  ],
  { collapse: false, exitOnError: true }
)
  .run()
  .then(() => {
    displaySuccessMessage()
    console.log()
  })
  .catch((e) => {
    console.log()
    console.log(e)
    process.exit(1)
  })
