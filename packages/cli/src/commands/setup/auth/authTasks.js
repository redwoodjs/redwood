import fs from 'fs'
import path from 'path'

import execa from 'execa'

import {
  getPaths,
  writeFilesTask,
  getGraphqlPath,
  graphFunctionDoesExist,
} from '../../../lib'
import { isTypeScriptProject } from '../../../lib/project'

import { files } from './authFiles'

const AUTH_PROVIDER_IMPORT = `import { AuthProvider } from '@redwoodjs/auth'`

export const getWebAppPath = () => getPaths().web.app

// TODO: Extract?
export const getSupportedProviders = () =>
  fs
    .readdirSync(path.resolve(__dirname, 'providers'))
    .map((file) => path.basename(file, '.js'))
    .filter((file) => file !== 'README.md')

// returns the content of App.{js,tsx} with import statements added
const addWebImports = (content, imports) => {
  return `${AUTH_PROVIDER_IMPORT}\n` + imports.join('\n') + '\n' + content
}

// returns the content of App.{js,tsx} with init lines added (if there are any)
const addWebInit = (content, init) => {
  if (init) {
    const regex = /const App = \(.*\) => [({]/
    const match = content.match(regex)

    if (!match) {
      return content
    }

    return content.replace(regex, `${init}\n\n${match[0]}`)
  }

  return content
}

const objectToComponentProps = (obj, options = { exclude: [] }) => {
  let props = []

  for (const [key, value] of Object.entries(obj)) {
    if (!options.exclude.includes(key)) {
      if (key === 'client') {
        props.push(`${key}={${value}}`)
      } else {
        props.push(`${key}="${value}"`)
      }
    }
  }

  return props
}

const addApiConfig = () => {
  const graphqlPath = getGraphqlPath()

  let content = fs.readFileSync(graphqlPath).toString()

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
      /^(\s*)(loggerConfig:)(.*)$/m,
      `$1getCurrentUser,\n$1$2$3`
    )
    fs.writeFileSync(graphqlPath, content)
  }
}

const isProviderSupported = (provider) => {
  return getSupportedProviders().indexOf(provider) !== -1
}

const apiSrcDoesExist = () => {
  return fs.existsSync(path.join(getPaths().api.src))
}

const webIndexDoesExist = () => {
  return fs.existsSync(getWebAppPath())
}

// returns the content of App.{js,tsx} with <AuthProvider> added
const addWebRender = (content, authProvider) => {
  const [
    _,
    newlineAndIndent,
    redwoodProviderOpen,
    redwoodProviderChildren,
    redwoodProviderClose,
  ] = content.match(/(\s+)(<RedwoodProvider.*?>)(.*)(<\/RedwoodProvider>)/s)

  const redwoodProviderChildrenLines = redwoodProviderChildren
    .split('\n')
    .map((line, index) => {
      return `${index === 0 ? '' : '  '}` + line
    })

  // Wrap with custom components e.g.
  // <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
  //     <FetchConfigProvider>
  //     <ApolloInjector>
  //     <AuthProvider client={ethereum} type="ethereum">
  const customRenderOpen = (authProvider.render || []).reduce(
    (acc, component) => acc + newlineAndIndent + '  ' + `<${component}>`,
    ''
  )

  const customRenderClose = (authProvider.render || []).reduce(
    (acc, component) => newlineAndIndent + '  ' + `</${component}>` + acc,
    ''
  )

  const props = objectToComponentProps(authProvider, { exclude: ['render'] })

  const renderContent =
    newlineAndIndent +
    redwoodProviderOpen +
    customRenderOpen +
    newlineAndIndent +
    '  ' +
    `<AuthProvider ${props.join(' ')}>` +
    redwoodProviderChildrenLines.join('\n') +
    `</AuthProvider>` +
    customRenderClose +
    newlineAndIndent +
    redwoodProviderClose

  return content.replace(
    /\s+<RedwoodProvider.*?>.*<\/RedwoodProvider>/s,
    renderContent
  )
}

// returns the content of App.{js,tsx} without the old auth import
const removeOldWebImports = (content, imports) => {
  return content.replace(`${AUTH_PROVIDER_IMPORT}\n` + imports.join('\n'), '')
}

// returns the content of App.{js,tsx} without the old auth init
const removeOldWebInit = (content, init) => {
  return content.replace(init, '')
}

// returns content with old auth provider removes
const removeOldAuthProvider = async (content) => {
  // get the current auth provider
  const [_, currentAuthProvider] = content.match(
    new RegExp('<AuthProvider.*type=[\'"](.*)[\'"]', 's')
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

// returns the content of App.{js,tsx} with <AuthProvider> updated
const updateWebRender = (content, authProvider) => {
  const props = objectToComponentProps(authProvider)
  const renderContent = `<AuthProvider ${props.join(' ')}>`

  return content.replace(
    new RegExp('<AuthProvider.*type=[\'"](.*)[\'"]>', 's'),
    renderContent
  )
}

/**
 * actually inserts the required config lines into App.{js,tsx}
 * exported for testing. `options` only used for testing
 */
export const addConfigToApp = async (config, force, options = {}) => {
  const { webAppPath: customWebAppPath } = options

  const webAppPath = customWebAppPath || getWebAppPath()

  let content = fs.readFileSync(webAppPath).toString()

  // update existing AuthProvider if --force else add new AuthProvider
  if (content.includes(AUTH_PROVIDER_IMPORT) && force) {
    content = await removeOldAuthProvider(content)
    content = updateWebRender(content, config.authProvider)
  } else {
    content = addWebRender(content, config.authProvider)
  }

  content = addWebImports(content, config.imports)
  content = addWebInit(content, config.init)

  fs.writeFileSync(webAppPath, content)
}

export const generateAuthLib = (provider, force, webAuthn) => ({
  title: 'Generating auth lib...',
  task: (_ctx, task) => {
    if (apiSrcDoesExist()) {
      return writeFilesTask(files({ provider, webAuthn }), {
        overwriteExisting: force,
      })
    } else {
      task.skip('api/src not found, skipping')
    }
  },
})

export const addAuthConfigToWeb = (config, force) => ({
  title: 'Adding auth config to web...',
  task: (_ctx, task) => {
    if (webIndexDoesExist()) {
      addConfigToApp(config, force)
    } else {
      task.skip(
        `web/src/App.${
          isTypeScriptProject() ? 'tsx' : 'js'
        } not found, skipping`
      )
    }
  },
})

export const addAuthConfigToGqlApi = {
  title: 'Adding auth config to GraphQL API...',
  task: (_ctx, task) => {
    if (graphFunctionDoesExist()) {
      addApiConfig()
    } else {
      task.skip('GraphQL function not found, skipping')
    }
  },
}

export const addWebPackages = (provider, webPackages, rwVersion) => ({
  title: 'Adding required web packages...',
  task: async () => {
    if (!isProviderSupported(provider)) {
      throw new Error(`Unknown auth provider '${provider}'`)
    }
    await execa('yarn', [
      'workspace',
      'web',
      'add',
      ...webPackages,
      `@redwoodjs/auth@${rwVersion}`,
    ])
  },
})

export const addApiPackages = (provider, apiPackages) =>
  apiPackages.length > 0 && {
    title: 'Adding required api packages...',
    task: async () => {
      if (!isProviderSupported(provider)) {
        throw new Error(`Unknown auth provider '${provider}'`)
      }
      await execa('yarn', ['workspace', 'api', 'add', ...apiPackages])
    },
  }

export const installPackages = {
  title: 'Installing packages...',
  task: async () => {
    await execa('yarn', ['install'])
  },
}

export const printNotes = (notes) => ({
  title: 'One more thing...',
  task: (_ctx, task) => {
    task.title = `One more thing...\n\n   ${notes.join('\n   ')}\n`
  },
})
