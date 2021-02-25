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

const AUTH_PROVIDER_IMPORT = `import { AuthProvider } from '@redwoodjs/auth'`

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
const WEB_SRC_APP_PATH = path.join(getPaths().web.src, 'App.js')

const SUPPORTED_PROVIDERS = fs
  .readdirSync(path.resolve(__dirname, 'providers'))
  .map((file) => path.basename(file, '.js'))
  .filter((file) => file !== 'README.md')

// returns the content of index.js with import statements added
const addWebImports = (content, imports) => {
  return `${AUTH_PROVIDER_IMPORT}\n` + imports.join('\n') + '\n' + content
}

// returns the content of index.js with init lines added
const addWebInit = (content, init) => {
  return content.replace(
    'const App = () => (',
    `${init}\n\nconst App = () => (`
  )
}

// returns the content of index.js with <AuthProvider> added
const addWebRender = (content, authProvider) => {
  const [_, indent, redwoodApolloProvider] = content.match(
    /(\s+)(<RedwoodApolloProvider>.*<\/RedwoodApolloProvider>)/s
  )

  const redwoodApolloProviderLines = redwoodApolloProvider
    .split('\n')
    .map((line) => {
      return '  ' + line
    })

  const customRenderOpen = (authProvider.render || []).reduce(
    (acc, component) => acc + indent + `<${component}>`,
    ''
  )

  const customRenderClose = (authProvider.render || []).reduce(
    (acc, component) => indent + `</${component}>` + acc,
    ''
  )

  const renderContent =
    customRenderOpen +
    indent +
    `<AuthProvider client={${authProvider.client}} type="${authProvider.type}">` +
    indent +
    redwoodApolloProviderLines.join('\n') +
    indent +
    `</AuthProvider>` +
    customRenderClose

  return content.replace(
    /\s+<RedwoodApolloProvider>.*<\/RedwoodApolloProvider>/s,
    renderContent
  )
}

// returns the content of index.js with <AuthProvider> updated
const updateWebRender = (content, authProvider) => {
  const renderContent = `<AuthProvider client={${authProvider.client}} type="${authProvider.type}">`
  return content.replace(/<AuthProvider client={.*} type=".*">/s, renderContent)
}

// returns the content of index.js without the old auth import
const removeOldWebImports = (content, imports) => {
  return content.replace(`${AUTH_PROVIDER_IMPORT}\n` + imports.join('\n'), '')
}

// returns the content of index.js without the old auth init
const removeOldWebInit = (content, init) => {
  return content.replace(init, '')
}

// returns content with old auth provider removes
const removeOldAuthProvider = async (content) => {
  // get the current auth provider
  const [_, currentAuthProvider] = content.match(
    /<AuthProvider client={.*} type="(.*)">/s
  )

  let oldAuthProvider
  try {
    oldAuthProvider = await import(`./providers/${currentAuthProvider}`)
  } catch (e) {
    throw new Error('Could not replace existing auth provider init')
  }

  content = removeOldWebImports(content, oldAuthProvider.config.imports)
  content = removeOldWebInit(content, oldAuthProvider.config.init)

  return content
}

// check to make sure AuthProvider doesn't exist
const checkAuthProviderExists = () => {
  const content = fs.readFileSync(WEB_SRC_APP_PATH).toString()

  if (content.includes(AUTH_PROVIDER_IMPORT)) {
    throw new Error(
      'Existing auth provider found.\nUse --force to override existing provider.'
    )
  }
}

// the files to create to support auth
export const files = (provider) => {
  const template = TEMPLATES[provider] ?? TEMPLATES.base
  return {
    [OUTPUT_PATH]: fs.readFileSync(template).toString(),
  }
}

// actually inserts the required config lines into index.js
export const addConfigToApp = async (config, force) => {
  let content = fs.readFileSync(WEB_SRC_APP_PATH).toString()

  // update existing AuthProvider if --force else add new AuthProvider
  if (content.includes(AUTH_PROVIDER_IMPORT) && force) {
    content = await removeOldAuthProvider(content)
    content = updateWebRender(content, config.authProvider)
  } else {
    content = addWebRender(content, config.authProvider)
  }

  content = addWebImports(content, config.imports)
  content = addWebInit(content, config.init)

  fs.writeFileSync(WEB_SRC_APP_PATH, content)
}

export const addApiConfig = () => {
  let content = fs.readFileSync(API_GRAPHQL_PATH).toString()

  // default to an array to avoid destructure errors
  const [_, hasAuthImport] =
    content.match(/(import {.*} from 'src\/lib\/auth.*')/s) || []

  if (!hasAuthImport) {
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
}

export const isProviderSupported = (provider) => {
  return SUPPORTED_PROVIDERS.indexOf(provider) !== -1
}

export const apiSrcDoesExist = () => {
  return fs.existsSync(API_SRC_PATH)
}

export const webIndexDoesExist = () => {
  return fs.existsSync(WEB_SRC_APP_PATH)
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
            addConfigToApp(providerData.config, force)
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
    // Don't throw existing provider error when --force exists
    if (!force) {
      checkAuthProviderExists()
    }

    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
