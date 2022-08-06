import fs from 'fs'
import path from 'path'

import execa from 'execa'

import {
  getPaths,
  resolveFile,
  writeFilesTask,
  getGraphqlPath,
  graphFunctionDoesExist,
  transformTSToJS,
} from '../../../lib'
import { isTypeScriptProject } from '../../../lib/project'

import { files } from './authFiles'

const AUTH_PROVIDER_HOOK_IMPORT = `import { AuthProvider, useAuth } from './auth'`
const AUTH_HOOK_IMPORT = `import { useAuth } from './auth'`

export const getWebAppPath = () => getPaths().web.app

// TODO: Extract?
export const getSupportedProviders = () =>
  fs
    .readdirSync(path.resolve(__dirname, 'providers'))
    .map((file) => path.basename(file, '.js'))
    .filter((file) => file !== 'README.md')

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

const addAuthImportToApp = (content) => {
  const contentLines = content.split('\n')
  // Find the last import line that's not a .css or .scss import
  const importIndex = contentLines.findLastIndex((line) =>
    /^\s*import (?!.*(?:.css'|.scss'))/.test(line)
  )

  // After the import found above, insert a blank line followed by the
  // AuthProvider and useAuth import
  contentLines.splice(importIndex + 1, 0, '', AUTH_PROVIDER_HOOK_IMPORT)

  return contentLines.join('\n')
}

const addAuthImportToRoutes = (content) => {
  const contentLines = content.split('\n')
  // Find the last import line that's not a .css or .scss import
  const importIndex = contentLines.findLastIndex((line) =>
    /^\s*import (?!.*(?:.css'|.scss'))/.test(line)
  )

  // After the import found above, insert a blank line followed by the
  // useAuth import
  contentLines.splice(importIndex + 1, 0, '', AUTH_HOOK_IMPORT)

  return contentLines.join('\n')
}

const hasAuthProvider = (content) => {
  return /\s*<AuthProvider>/.test(content)
}

/** returns the content of App.{js,tsx} with <AuthProvider> added */
const addAuthProviderToApp = (content) => {
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

  const renderContent =
    newlineAndIndent +
    redwoodProviderOpen +
    newlineAndIndent +
    '  ' +
    `<AuthProvider>` +
    redwoodProviderChildrenLines.join('\n') +
    `</AuthProvider>` +
    newlineAndIndent +
    redwoodProviderClose

  return content.replace(
    /\s+<RedwoodProvider.*?>.*<\/RedwoodProvider>/s,
    renderContent
  )
}

const hasUseAuthHook = (componentName, content) => {
  return new RegExp(`<${componentName}[^>]*useAuth={.*?}.*?>`, 's').test(
    content
  )
}

const addUseAuthHook = (componentName, content) => {
  return content.replace(
    `<${componentName}`,
    `<${componentName} useAuth={useAuth}`
  )
}

/**
 * Actually inserts the required config lines into App.{js,tsx}
 * Exported for testing
 */
export const addConfigToApp = async () => {
  const webAppPath = getWebAppPath()

  let content = fs.readFileSync(webAppPath).toString()

  if (!content.includes(AUTH_PROVIDER_HOOK_IMPORT)) {
    content = addAuthImportToApp(content)
  }

  if (!hasAuthProvider(content)) {
    content = addAuthProviderToApp(content)
  }

  if (!hasUseAuthHook('RedwoodApolloProvider', content)) {
    content = addUseAuthHook('RedwoodApolloProvider', content)
  }

  fs.writeFileSync(webAppPath, content)
}

export const createWebAuthTs = (provider) => {
  const templatesBaseDir = path.resolve(__dirname, 'templates', 'web')
  const templates = fs.readdirSync(templatesBaseDir)

  const templateFileName = templates.find((template) =>
    template.startsWith(provider)
  )

  const templateExtension = templateFileName.split('.').at(-2)

  // Find an unused filename
  // Start with web/src/auth.{ts,tsx}
  // Then web/src/providerAuth.{ts,tsx}
  // Then web/src/providerAuth2.{ts,tsx}
  // Then web/src/providerAuth3.{ts,tsx}
  // etc
  let authFileName = path.join(getPaths().web.src, 'auth')
  let i = 1
  while (resolveFile(authFileName)) {
    const count = i > 1 ? i : ''

    authFileName = path.join(getPaths().web.src, provider + 'Auth' + count)

    i++
  }

  authFileName = authFileName + '.' + templateExtension

  let template = fs.readFileSync(
    path.join(templatesBaseDir, templateFileName),
    'utf-8'
  )

  template = isTypeScriptProject()
    ? template
    : transformTSToJS(authFileName, template)

  fs.writeFileSync(authFileName, template)
}

export const addConfigToRoutes = () => {
  const webRoutesPath = getPaths().web.routes

  let content = fs.readFileSync(webRoutesPath).toString()

  if (!content.includes(AUTH_HOOK_IMPORT)) {
    content = addAuthImportToRoutes(content)
  }

  if (!hasUseAuthHook('Router', content)) {
    content = addUseAuthHook('Router', content)
  }

  fs.writeFileSync(webRoutesPath, content)
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

export const addAuthConfigToWeb = (provider) => ({
  title: 'Adding auth config to web...',
  task: (_ctx, task) => {
    if (webIndexDoesExist()) {
      addConfigToApp()
      createWebAuthTs(provider)
      addConfigToRoutes()
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
