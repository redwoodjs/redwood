import fs from 'fs'
import path from 'path'

import { resolveFile } from '@redwoodjs/project-config'

import { colors } from './colors'
import { getPaths } from './paths'

export const getGraphqlPath = () => {
  return resolveFile(path.join(getPaths().api.functions, 'graphql'))
}

export const graphFunctionDoesExist = () => {
  const graphqlPath = getGraphqlPath()
  return graphqlPath && fs.existsSync(graphqlPath)
}

export const isTypeScriptProject = () => {
  const paths = getPaths()
  return (
    fs.existsSync(path.join(paths.web.base, 'tsconfig.json')) ||
    fs.existsSync(path.join(paths.api.base, 'tsconfig.json'))
  )
}

export const getInstalledRedwoodVersion = () => {
  try {
    const packageJson = require('../../package.json')
    return packageJson.version
  } catch (e) {
    console.error(colors.error('Could not find installed redwood version'))
    process.exit(1)
  }
}

export const addEnvVarTask = (name: string, value: string, comment: string) => {
  return {
    title: `Adding ${name} var to .env...`,
    task: () => {
      const envPath = path.join(getPaths().base, '.env')
      const content = [comment && `# ${comment}`, `${name}=${value}`, ''].flat()
      let envFile = ''

      if (fs.existsSync(envPath)) {
        envFile = fs.readFileSync(envPath).toString() + '\n'
      }

      fs.writeFileSync(envPath, envFile + content.join('\n'))
    },
  }
}
