import fs from 'node:fs'

import { buildWeb } from '@redwoodjs/internal/dist/build/web.js'
import projectConfig from '@redwoodjs/project-config'

const rwPaths = projectConfig.getPaths()

/**
 * Build the web side of a Redwood project using Vite
 * @param {string} webDir - The path to the web side of the project
 */
const buildWebSide = async (webDir) => {
  const configFile = rwPaths.web.viteConfig

  if (!configFile) {
    throw new Error('Could not locate your web/vite.config.{js,ts} file')
  }

  // @NOTE: necessary for keeping the cwd correct for postcss/tailwind
  process.chdir(webDir)
  process.env.NODE_ENV = 'production'

  // Right now, the buildWeb function looks up the config file from project-config
  // In the future, if we have multiple web spaces we could pass in the cwd here
  buildWeb({
    verbose: true,
  })
}

const webDirIndex = process.argv.findIndex((arg) => arg.startsWith('--webDir'))

if (webDirIndex === -1) {
  console.error(
    'Please pass the full path to the web side using the --webDir argument'
  )
  process.exit(1)
}

let webDir

if (process.argv[webDirIndex].includes('=')) {
  // rw-vite-build --webDir="/full/path/with/eq=sign/to/rw-app/web"
  webDir = process.argv[webDirIndex].split('=').slice(1).join('=')
} else {
  // rw-vite-build --webDir /full/path/to/rw-app/web
  webDir = process.argv[webDirIndex + 1]
}

if (!fs.existsSync(webDir)) {
  throw new Error(`Could not find web directory at ${webDir}`)
}

if (!fs.existsSync(`${webDir}/package.json`)) {
  throw new Error(`${webDir} does not appear to be a Redwood web directory`)
}

buildWebSide(webDir)
