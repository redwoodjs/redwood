import { createServer } from 'vite'

import projectConfig from '@redwoodjs/project-config'

const rwPaths = projectConfig.getPaths()

const startDevServer = async () => {
  const configFile = rwPaths.web.viteConfig

  if (!configFile) {
    throw new Error('Could not locate your web/vite.config.{js,ts} file')
  }

  const devServer = await createServer({
    configFile,
    envFile: false, // env file is handled by plugins in the redwood-vite plugin
  })

  await devServer.listen()

  process.stdin.on('data', async (data) => {
    const str = data.toString().trim().toLowerCase()
    if (str === 'rs' || str === 'restart') {
      await devServer.restart(true)
    }
  })

  devServer.printUrls()
}

startDevServer()
