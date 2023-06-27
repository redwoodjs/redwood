import fs from 'node:fs'

import yargsParser from 'yargs-parser'

import { buildWeb } from '@redwoodjs/internal/dist/build/web.js'
import projectConfig from '@redwoodjs/project-config'

const rwPaths = projectConfig.getPaths()

const { webDir } = yargsParser(process.argv.slice(2), {
  string: ['webDir'],
})

if (!webDir) {
  console.error(
    'Please pass the full path to the web side using the --webDir argument'
  )
  process.exit(1)
}

if (!fs.existsSync(webDir)) {
  console.error(`Could not find web directory at ${webDir}`)
  process.exit(1)
}

if (!fs.existsSync(`${webDir}/package.json`)) {
  console.error(`${webDir} does not appear to be a Redwood web directory`)
  process.exit(1)
}

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

buildWebSide(webDir)
