import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import terminalLink from 'terminal-link'
import { resolveFile } from '@redwoodjs/internal'

import { getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

const API_GRAPHQL_PATH = resolveFile(
  path.join(getPaths().api.functions, 'graphql')
)

const API_SRC_PATH = path.join(getPaths().api.src)
const TEMPLATES = fs
  .readdirSync(path.resolve(__dirname, 'templates'))
  .reduce((templates, file) => {
    if (file === 'auth.js.template') {
      return { ...templates, base: path.resolve(__dirname, 'templates', file) }
    } else {
      const provider = file.replace('.auth.js.template', '')
      return {
        ...templates,
        [provider]: path.resolve(__dirname, 'templates', file),
      }
    }
  }, {})
const OUTPUT_PATH = path.join(getPaths().api.lib, 'auth.js')
const WEB_SRC_INDEX_PATH = path.join(getPaths().web.src, 'index.js')
const SUPPORTED_PROVIDERS = fs
  .readdirSync(path.resolve(__dirname, 'providers'))
  .map((file) => path.basename(file, '.js'))
  .filter((file) => file !== 'README.md')

// returns the content of index.js with import statements added
const addWebImports = (content, imports) => {
  return (
    `import { AuthProvider } from '@redwoodjs/auth'\n` +
    imports.join('\n') +
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
export const files = (provider) => {
  const template = TEMPLATES[provider] ?? TEMPLATES.base
  return {
    [OUTPUT_PATH]: fs.readFileSync(template).toString(),
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
    /^(.*services.*)$/m,
    `$1\n\nimport { getCurrentUser } from 'src/lib/auth'`
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
export const description = 'Generate an auth configuration'
export const builder = (yargs) => {
  yargs
    .positional('provider', {
      choices: SUPPORTED_PROVIDERS,
      description: 'Auth provider to configure',
      type: 'string',
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-auth'
      )}`
    )
}

export const handler = async ({ provider, force }) => {
  const providerData = await import(`./providers/${provider}`)

  const tasks = new Listr(
    [
      {
        title: 'Generating auth lib...',
        task: (_ctx, task) => {
          if (apiSrcDoesExist()) {
            return writeFilesTask(files(provider), { overwriteExisting: force })
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
        title: 'Adding required web packages...',
        task: async () => {
          if (!isProviderSupported(provider)) {
            throw new Error(`Unknown auth provider '${provider}'`)
          }
          await execa('yarn', [
            'workspace',
            'web',
            'add',
            ...providerData.webPackages,
            '@redwoodjs/auth',
          ])
        },
      },
      providerData.apiPackages.length > 0 && {
        title: 'Adding required api packages...',
        task: async () => {
          if (!isProviderSupported(provider)) {
            throw new Error(`Unknown auth provider '${provider}'`)
          }
          await execa('yarn', [
            'workspace',
            'api',
            'add',
            ...providerData.apiPackages,
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
