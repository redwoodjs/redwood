import { createServer } from 'vite'

import { getPaths } from '@redwoodjs/internal/dist/paths.js'

const rwPaths = getPaths()

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

  process.stdin.on('data', (data) => {
    const str = data.toString().trim().toLowerCase()
    if (str === 'rs' || str === 'restart') {
      devServer.restart(true)
    }
  })

  devServer.printUrls()
}

startDevServer()
