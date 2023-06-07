import { buildWeb } from '@redwoodjs/internal/dist/build/web.js'
import projectConfig from '@redwoodjs/project-config'

const rwPaths = projectConfig.getPaths()

const buildWebSide = async () => {
  const configFile = rwPaths.web.viteConfig

  if (!configFile) {
    throw new Error('Could not locate your web/vite.config.{js,ts} file')
  }

  // @NOTE: necessary for keeping the cwd correct for postcss/tailwind
  process.chdir(rwPaths.web.base)
  process.env.NODE_ENV = 'production'

  // Right now, the buildWeb function looks up the config file from project-config
  // In the future, if we have multiple web spaces we could pass in the cwd here
  buildWeb({
    verbose: true,
  })
}

buildWebSide()
