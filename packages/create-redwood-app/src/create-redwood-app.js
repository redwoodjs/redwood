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

const targetDir = String(process.argv.slice(2))
const newAppDir = path.resolve(process.cwd(), targetDir)

const tasks = new Listr(
  [
    {
      title: 'Checking if Soil is Available',
      task: () => {
        return new Listr(
          [
            {
              title: 'Checking for path in command',
              task: (ctx) => {
                if (!targetDir) {
                  ctx.stop = true
                  throw new Error(
                    'Missing path arg. Usage `yarn create redwood-app ./path/to/new-project`'
                  )
                }
              },
            },
            {
              title: 'Checking if directory already exists',
              task: (ctx) => {
                if (fs.existsSync(newAppDir)) {
                  ctx.stop = true
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
      title: `Tilling Soil at "${newAppDir}/"`,
      enabled: (ctx) => ctx.stop != true,
      task: () => {
        fs.mkdirSync(newAppDir, { recursive: true })
      },
    },
    {
      //TODO better Listr error handling and ctx updates
      title: 'Planting Seed',
      enabled: (ctx) => ctx.stop != true,
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
              } catch (e) {
                console.log('0---------------------------')
                console.log(e)
                task.skip('Error updating title tag for /web/src/index.html')
                throw new Error(e)
              }
            },
          },
        ])
      },
    },
    // {
    //   title: 'Watering Soil',
    //   enabled: (ctx) => ctx.stop != true,
    //   task: async (ctx, task) => {
    //     task.output = `${task.title} ...installing packages...`
    //     return execa('yarn install', {
    //       shell: true,
    //       cwd: `${targetDir}`,
    //     }).catch(() => {
    //       ctx.stop = true
    //       task.title = `${task.title} (or not)`
    //       task.skip('Yarn not installed. Cannot proceed.')
    //     })
    //   },
    // },
    {
      title: 'Success: Your Redwood is Ready to Grow!',
      task: () => {
        console.log('installation complete')
      },
    },
  ],
  { collapse: false }
)

tasks.run().catch((e) => {
  console.log(e.message)
})
