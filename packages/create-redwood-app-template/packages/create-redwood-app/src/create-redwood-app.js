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

const RELEASE_URL =
  'https://api.github.com/repos/redwoodjs/create-redwood-app/releases'

const latestReleaseZipFile = async () => {
  const response = await axios.get(RELEASE_URL)
  return response.data[0].zipball_url
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

const tmpDownloadPath = tmp.tmpNameSync({
  prefix: 'redwood',
  postfix: '.zip',
})

// To run any commands, use these to set path for the working dir
const targetDir = String(process.argv.slice(2)).replace(/,/g, '-')
const newAppDir = path.resolve(process.cwd(), targetDir)

// Uses Listr: https://github.com/SamVerschueren/listr
// Sequencial terminal tasks and output
// Individual task error stops execution unless `exitOnError: false`
const tasks = new Listr(
  [
    {
      title: 'Pre-Installation Check',
      task: () => {
        return new Listr(
          [
            {
              title: 'Checking for path in command',
              task: () => {
                if (!targetDir) {
                  throw new Error(
                    'Missing path arg. Usage `yarn create redwood-app ./path/to/new-project`'
                  )
                }
              },
            },
            {
              title: 'Checking if directory already exists',
              task: () => {
                if (fs.existsSync(newAppDir)) {
                  throw new Error(
                    `Install error: directory ${targetDir} already exists.`
                  )
                }
              },
            },
          ],
          { concurrent: true }
        )
      },
    },
    {
      title: `Creating "${newAppDir}/"`,
      task: () => {
        fs.mkdirSync(newAppDir, { recursive: true })
      },
    },
    {
      title: 'Extracting “Create-Redwood-App” Current Release',
      task: () => {
        return new Listr([
          {
            title: `Downloading latest release from ${RELEASE_URL}`,
            task: async () => {
              const url = await latestReleaseZipFile()
              return downloadFile(url, tmpDownloadPath)
            },
          },
          {
            title: 'Extracting...',
            task: async () => {
              await decompress(tmpDownloadPath, newAppDir, { strip: 1 })
            },
          },
          {
            title: 'Set Local App Development README.md',
            task: (_ctx, task) => {
              try {
                fs.unlinkSync(path.join(newAppDir, './README.md'))
              } catch (e) {
                task.skip(
                  'Could not replace source README.md with a local copy'
                )
              }
              try {
                fs.renameSync(
                  path.join(newAppDir, './README_APP.md'),
                  path.join(newAppDir, './README.md')
                )
              } catch (e) {
                task.skip(
                  'Could not replace source README.md with a local copy'
                )
              }
            },
          },
          {
            title: 'Set Local App Development .gitignore',
            task: (_ctx, task) => {
              try {
                fs.unlinkSync(path.join(newAppDir, './.gitignore'))
              } catch (e) {
                task.skip(
                  'Could not replace source .gitignore with a local copy'
                )
              }
              try {
                fs.renameSync(
                  path.join(newAppDir, './.gitignore.app'),
                  path.join(newAppDir, './.gitignore')
                )
              } catch (e) {
                task.skip(
                  'Could not replace source .gitignore with a local copy'
                )
              }
            },
          },
          {
            title: 'Renaming index.html Meta Title',
            task: (_ctx, task) => {
              try {
                const indexHtml = path.join(newAppDir, './web/src/index.html')
                const data = fs.readFileSync(indexHtml, 'utf8')
                const newTitle = String(targetDir)
                  .split('/')
                  .slice(-1)[0]
                  .split(/[ _-]/)
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
                fs.writeFileSync(
                  indexHtml,
                  data.replace(
                    RegExp('<title>(.*?)</title>'),
                    '<title>' + String(newTitle) + '</title>'
                  ),
                  'utf8'
                )
                task.title = `index.html Meta Title is now "${newTitle}"`
              } catch (e) {
                task.skip('Error updating title tag for /web/src/index.html')
              }
            },
          },
        ])
      },
    },
    {
      title: 'Installing Packages',
      task: () => {
        return new Listr([
          {
            title: 'Engine Check: Node and Yarn Version Requirements',
            task: async(ctx, task) => {
              return execa(`check-node-version --node $(node -p "require('./package.json').engines.node")\
                --yarn $(node -p "require('./package.json').engines.yarn")`, {
                shell: true,
                cwd: `${targetDir}`,
              }).catch((e) => {
                ctx.engineError = true
                ctx.engineErrorMessage = e
                task.title = 'Error: Unmet package.json Engine Requirements'
                throw new Error('Version requirements not met: See Error below starting with "Wanted..." for details')
              })
            },
          },
          {
            title: 'Waiting to run `yarn install`',
            task: async (ctx, task) => {
              task.output = `...installing packages...`
              return execa('yarn install', {
                shell: true,
                cwd: `${targetDir}`,
              }).then(
                task.title = 'Running `yarn install`'
              ).catch((e) => {
                ctx.installError = true
                task.title = 'Error: Could not run `yarn install`'
                throw new Error('Confirm yarn is installed and meets RedwoodJS version requirements')
              })
            },
          },
        ],
        { exitOnError: false }
        )
      },
    },
    {
      title: '...Redwood planting in progress...',
      task: (ctx, task) => {
        if (ctx.engineError || ctx.installError) {
          task.title = `WARNING: please fix errors and then run \`yarn install\` from ${targetDir}/ root`
          throw new Error(ctx.engineErrorMessage)
        } else {
          task.title = 'SUCCESS: Your Redwood is Ready to Grow!'
          console.log('')
        }
      },
    },
  ],
  { collapse: false }
)

tasks.run().catch((e) => {
  console.log(e.message)
})
