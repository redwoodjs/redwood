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

const [_arg1, _arg2, ...args] = process.argv

const helpInfo = `Usage: ${name} <target-dir> [options]\n\n Available options\n\n --help, -h\n --version, -v`

if (args[0].startsWith('-')) {
  if (['-h', '--help'].includes(args[0])) {
    console.log(helpInfo)
  } else if (['-v', '--version'].includes(args[0])) {
    console.log(version)
  } else {
    console.error(`Invalid option, use ${name} --help to know more`)
  }
  process.exit(0)
}

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
      task: () => {
        return execa('yarn install', {
          shell: true,
          cwd: newAppDir,
        })
      },
    },
  ]
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
    // TODO: show helpful out for next steps.
    console.log()
    console.log(
      `Thanks for trying out Redwood! We've created your app in '${newAppDir}'`
    )
    console.log()
    console.log(
      'Inside that directory you can run `yarn rw dev` to start the development server.'
    )
  })
  .catch((e) => {
    console.log()
    console.log(e)
    process.exit(1)
  })
