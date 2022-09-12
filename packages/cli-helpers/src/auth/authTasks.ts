import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { writeFilesTask, transformTSToJS } from '../lib'
import { colors } from '../lib/colors'
import { getPaths, resolveFile } from '../lib/paths'
import {
  isTypeScriptProject,
  getGraphqlPath,
  graphFunctionDoesExist,
} from '../lib/project'

import { apiSideFiles, generateUniqueFileNames } from './authFiles'

const AUTH_PROVIDER_HOOK_IMPORT = `import { AuthProvider, useAuth } from './auth'`
const AUTH_HOOK_IMPORT = `import { useAuth } from './auth'`

export const getWebAppPath = () => getPaths().web.app

const addApiConfig = () => {
  const graphqlPath = getGraphqlPath()

  if (!graphqlPath) {
    throw new Error('Could not find your graphql file path')
  }

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

const apiSrcDoesExist = () => {
  return fs.existsSync(path.join(getPaths().api.src))
}

const webIndexDoesExist = () => {
  return fs.existsSync(getWebAppPath())
}

const addAuthImportToApp = (content: string) => {
  const contentLines = content.split('\n')
  // Find the last import line that's not a .css or .scss import
  // @ts-expect-error - We polyfill findLastIndex
  const importIndex = contentLines.findLastIndex((line: string) =>
    /^\s*import (?!.*(?:.css'|.scss'))/.test(line)
  )

  // After the import found above, insert a blank line followed by the
  // AuthProvider and useAuth import
  contentLines.splice(importIndex + 1, 0, '', AUTH_PROVIDER_HOOK_IMPORT)

  return contentLines.join('\n')
}

const addAuthImportToRoutes = (content: string) => {
  const contentLines = content.split('\n')
  // Find the last import line that's not a .css or .scss import
  // @ts-expect-error - We polyfill findLastIndex
  const importIndex = contentLines.findLastIndex((line: string) =>
    /^\s*import (?!.*(?:.css'|.scss'))/.test(line)
  )

  // After the import found above, insert a blank line followed by the
  // useAuth import
  contentLines.splice(importIndex + 1, 0, '', AUTH_HOOK_IMPORT)

  return contentLines.join('\n')
}

const hasAuthProvider = (content: string) => {
  return /\s*<AuthProvider>/.test(content)
}

/** returns the content of App.{js,tsx} with <AuthProvider> added */
const addAuthProviderToApp = (content: string) => {
  const match = content.match(
    /(\s+)(<RedwoodProvider.*?>)(.*)(<\/RedwoodProvider>)/s
  )

  if (!match) {
    throw new Error('Could not find <RedwoodProvider> in App.{js,tsx}')
  }

  const [
    _,
    newlineAndIndent,
    redwoodProviderOpen,
    redwoodProviderChildren,
    redwoodProviderClose,
  ] = match

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

const hasUseAuthHook = (componentName: string, content: string) => {
  return new RegExp(
    `<${componentName}.*useAuth={.*?}.*?>.*<\/${componentName}>`,
    's'
  ).test(content)
}

const addUseAuthHook = (componentName: string, content: string) => {
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

  if (/\s*<RedwoodApolloProvider/.test(content)) {
    if (!hasUseAuthHook('RedwoodApolloProvider', content)) {
      content = addUseAuthHook('RedwoodApolloProvider', content)
    }
  } else {
    console.warn(
      colors.warning(
        'Could not find <RedwoodApolloProvider>.\nIf you are using a custom ' +
          'GraphQL Client you will have to make sure it gets access to your ' +
          '`useAuth`, if it needs it.'
      )
    )
  }

  fs.writeFileSync(webAppPath, content)
}

export const createWebAuth = (
  basedir: string,
  provider: string,
  webAuthn: boolean
) => {
  const templatesBaseDir = path.join(basedir, 'templates', 'web')
  const templates = fs.readdirSync(templatesBaseDir)

  const templateFileName = templates.find((template) => {
    return template.startsWith('auth.' + (webAuthn ? 'webAuthn.ts' : 'ts'))
  })

  if (!templateFileName) {
    throw new Error('Could not find the auth.ts template')
  }

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

  let template: string | undefined = fs.readFileSync(
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

export const generateAuthApi = (
  basedir: string,
  provider: string,
  force: boolean,
  webAuthn: boolean
): Listr.ListrTask => ({
  title: 'Generating auth api side files...',
  task: (_ctx: Listr.ListrContext, task: Listr.ListrTaskWrapper) => {
    if (!apiSrcDoesExist()) {
      return task.skip?.('api/src not found, skipping')
    }

    // The keys in `filesRecord` are the full paths to where the file contents,
    // which is the values in `filesRecord`, will be written.
    let filesRecord = apiSideFiles({ basedir, webAuthn })

    if (!force) {
      const uniqueFilesRecord = generateUniqueFileNames(filesRecord, provider)

      if (
        Object.keys(filesRecord).join(',') !==
        Object.keys(uniqueFilesRecord).join(',')
      ) {
        console.warn(
          colors.warning(
            "To avoid overwriting existing files we've generated new file " +
              'names for the newly generated files. This probably means ' +
              `${provider} auth doesn't work out of the box. You'll most ` +
              'likely have to manually merge some of the generated files ' +
              'with your existing auth files'
          )
        )
      }

      filesRecord = uniqueFilesRecord
    }

    return writeFilesTask(filesRecord, { overwriteExisting: force })
  },
})

export const addAuthConfigToWeb = (
  basedir: string,
  provider: string,
  webAuthn = false
) => ({
  title: 'Adding auth config to web...',
  task: (_ctx: Listr.ListrContext, task: Listr.ListrTaskWrapper) => {
    if (webIndexDoesExist()) {
      addConfigToApp()
      createWebAuth(basedir, provider, webAuthn)
      addConfigToRoutes()
    } else {
      task.skip?.(
        `web/src/App.${
          isTypeScriptProject() ? 'tsx' : 'js'
        } not found, skipping`
      )
    }
  },
})

export const addAuthConfigToGqlApi = {
  title: 'Adding auth config to GraphQL API...',
  task: (_ctx: Listr.ListrContext, task: Listr.ListrTaskWrapper) => {
    if (graphFunctionDoesExist()) {
      addApiConfig()
    } else {
      task.skip?.('GraphQL function not found, skipping')
    }
  },
}

export const addWebPackages = (webPackages: string[], rwVersion: string) => ({
  title: 'Adding required web packages...',
  task: async () => {
    const args = [
      'workspace',
      'web',
      'add',
      ...webPackages,
      `@redwoodjs/auth@${rwVersion}`,
    ]
    await execa('yarn', args)
  },
})

export const addApiPackages = (apiPackages: string[]) =>
  apiPackages.length > 0 && {
    title: 'Adding required api packages...',
    task: async () => {
      await execa('yarn', ['workspace', 'api', 'add', ...apiPackages])
    },
  }

export const installPackages = {
  title: 'Installing packages...',
  task: async () => {
    await execa('yarn', ['install'])
  },
}

export const printNotes = (notes: string[]) => ({
  title: 'One more thing...',
  task: (_ctx: Listr.ListrContext, task: Listr.ListrTaskWrapper) => {
    task.title = `One more thing...\n\n   ${notes.join('\n   ')}\n`
  },
})
