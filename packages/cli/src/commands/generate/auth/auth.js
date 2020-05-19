import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import { getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

const API_GRAPHQL_PATH = path.join(getPaths().api.functions, 'graphql.js')
const API_SRC_PATH = path.join(getPaths().api.src)
const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'auth.js.template')
const TEMPLATE = fs.readFileSync(TEMPLATE_PATH).toString()
const OUTPUT_PATH = path.join(getPaths().api.lib, 'auth.js')
const WEB_SRC_INDEX_PATH = path.join(getPaths().web.src, 'index.js')
const SUPPORTED_PROVIDERS = fs
  .readdirSync(path.resolve(__dirname, 'providers'))
  .map((file) => path.basename(file, '.js'))

// returns the content of index.js with import statements added
const addWebImports = (content, imports) => {
  const importStatements = imports.map((imp) => {
    return `import ${imp.import} from '${imp.from}'`
  })

  return (
    `import { AuthProvider } from '@redwoodjs/auth'\n` +
    importStatements.join('\n') +
    '\n' +
    content
  )
}

// returns the content of index.js with init lines added
const addWebInit = (content, init) => {
  return content.replace(/ReactDOM.render/, `${init}\n\nReactDOM.render`)
}

// returns the content of index.js with <AuthProvider> added
const addWebRender = (content, authProvider) => {
  const [_, indent, redwoodProvider] = content.match(
    /(\s+)(<RedwoodProvider>.*<\/RedwoodProvider>)/s
  )
  const redwoodProviderLines = redwoodProvider.split('\n').map((line) => {
    return '  ' + line
  })
  const renderContent =
    indent +
    `<AuthProvider client={${authProvider.client}} type="${authProvider.type}">` +
    indent +
    redwoodProviderLines.join('\n') +
    indent +
    `</AuthProvider>`

  return content.replace(
    /\s+<RedwoodProvider>.*<\/RedwoodProvider>/s,
    renderContent
  )
}

// the files to create to support auth
export const files = () => {
  return {
    [OUTPUT_PATH]: TEMPLATE,
  }
}

// actually inserts the required config lines into index.js
export const addConfigToIndex = (config) => {
  let content = fs.readFileSync(WEB_SRC_INDEX_PATH).toString()

  content = addWebImports(content, config.imports)
  content = addWebInit(content, config.init)
  content = addWebRender(content, config.authProvider)

  fs.writeFileSync(WEB_SRC_INDEX_PATH, content)
}

export const addApiConfig = () => {
  let content = fs.readFileSync(API_GRAPHQL_PATH).toString()

  // add import statement
  content = content.replace(
    /^(.*importAll.*)$/m,
    `$1\n\nimport { getCurrentUser } from 'src/lib/auth.js'`
  )
  // add object to handler
  content = content.replace(
    /^(\s*)(schema: makeMergedSchema)(.*)$/m,
    `$1getCurrentUser,\n$1$2$3`
  )
  fs.writeFileSync(API_GRAPHQL_PATH, content)
}

export const isProviderSupported = (provider) => {
  return SUPPORTED_PROVIDERS.indexOf(provider) !== -1
}

export const apiSrcDoesExist = () => {
  return fs.existsSync(API_SRC_PATH)
}

export const webIndexDoesExist = () => {
  return fs.existsSync(WEB_SRC_INDEX_PATH)
}

export const graphFunctionDoesExist = () => {
  return fs.existsSync(API_GRAPHQL_PATH)
}

export const command = 'auth <provider>'
export const desc = 'Generates auth configuration.'
export const builder = {
  force: { type: 'boolean', default: false },
}

export const handler = async ({ provider, force }) => {
  const providerData = await import(`./providers/${provider}`)

  const tasks = new Listr(
    [
      {
        title: 'Adding required packages...',
        task: async () => {
          if (!isProviderSupported(provider)) {
            throw new Error(`Unknown auth provider '${provider}'`)
          }
          await execa('yarn', [
            'workspace',
            'web',
            'add',
            ...providerData.packages,
            '@redwoodjs/auth',
          ])
        },
      },
      {
        title: 'Installing packages...',
        task: async () => {
          await execa('yarn', ['install'])
        },
      },
      {
        title: 'Generating auth lib...',
        task: (_ctx, task) => {
          if (apiSrcDoesExist()) {
            return writeFilesTask(files(), { overwriteExisting: force })
          } else {
            task.skip('api/src not found, skipping')
          }
        },
      },
      {
        title: 'Adding auth config to web...',
        task: (_ctx, task) => {
          if (webIndexDoesExist()) {
            addConfigToIndex(providerData.config)
          } else {
            task.skip('web/src/index.js not found, skipping')
          }
        },
      },
      {
        title: 'Adding auth config to GraphQL API...',
        task: (_ctx, task) => {
          if (graphFunctionDoesExist()) {
            addApiConfig()
          } else {
            task.skip('GraphQL function not found, skipping')
          }
        },
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...\n\n   ${providerData.notes.join(
            '\n   '
          )}\n`
        },
      },
    ].filter(Boolean),
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
