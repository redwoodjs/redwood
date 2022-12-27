import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { ListrTask, ListrTaskWrapper, ListrRenderer } from 'listr2'

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

/**
 * This function looks for the createGraphQLHandler function call and adds
 * `authDecoder` to its arguments if it's not already there. Almost always it
 * will not be there, but if the user already has an auth provider set up and
 * wants to add another one it's probably there, and in that case we don't
 * want to add another one
 *
 * @param content - The contents of api/src/functions/graphql.ts
 * @returns content with `authDecoder` added unless it was already there
 */
function addAuthDecoderToCreateGraphQLHandler(content: string) {
  // Have to use a funky looking Regex here to prevent a "Polynomial regular
  // expression used on uncontrolled data" warning/error. A.k.a "Catastrophic
  // Backtracking". The usual fix is to use an atomic group, but the JS
  // regex engine doesn't support that, so we use a lookaround group to
  // emulate an atomic group.
  if (
    !new RegExp('(?=(^.*?createGraphQLHandler))\\1.*\\bauthDecoder', 's').test(
      content
    )
  ) {
    return content.replace(
      /^(?<indentation>\s*)(loggerConfig:)(.*)$/m,
      `$<indentation>authDecoder,\n$<indentation>$2$3`
    )
  }

  return content
}

/**
 * Replace the existing `import { authDecoder } from 'x'` with a new one
 *
 * @param content - The contents of api/src/functions/graphql.ts
 * @param decoderImport - Something like
 *   `import { authDecoder } from '@redwoodjs/auth-clerk-api'`
 * @returns content with the authDecoder import replaced with the new import
 */
function replaceAuthDecoderImport(content: string, decoderImport: string) {
  return content.replace(/^import { authDecoder .*} from .+/, decoderImport)
}

/**
 * Replace the existing `  authDecoder: myAuthDecoder,` with a standard
 * `  authDecoder,`
 *
 * @param content - The contents of api/src/functions/graphql.ts
 * @returns content with standard authDecoder arg to createGraphQLHandler
 */
function replaceAuthDecoderArg(content: string) {
  return content.replace(/^(\s+)authDecoder\b.+/m, '$1authDecoder,')
}

// Exporting this to make it easier to test
export const addApiConfig = (authDecoderImport?: string) => {
  const graphqlPath = getGraphqlPath()

  if (!graphqlPath) {
    throw new Error('Could not find your graphql file path')
  }

  const content = fs.readFileSync(graphqlPath).toString()
  let newContent = content

  // If there already is an import we replace it with a new one
  const replaceExistingImport = /^import { authDecoder .*} from /m.test(content)

  if (authDecoderImport) {
    if (replaceExistingImport) {
      newContent = replaceAuthDecoderImport(newContent, authDecoderImport)
      newContent = replaceAuthDecoderArg(newContent)
    } else {
      newContent = authDecoderImport + '\n' + newContent
      newContent = addAuthDecoderToCreateGraphQLHandler(newContent)
    }
  }

  const hasCurrentUserImport =
    /(^import {.*?getCurrentUser(?!getCurrentUser).*?} from 'src\/lib\/auth')/s.test(
      newContent
    )

  if (!hasCurrentUserImport) {
    // add import statement
    newContent = newContent.replace(
      /^(import { db } from 'src\/lib\/db')$/m,
      `import { getCurrentUser } from 'src/lib/auth'\n$1`
    )

    // add object to handler
    newContent = newContent.replace(
      /^(\s*)(loggerConfig:)(.*)$/m,
      `$1getCurrentUser,\n$1$2$3`
    )
  }

  if (newContent !== content) {
    fs.writeFileSync(graphqlPath, newContent)
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

export const generateAuthApiFiles = <Renderer extends typeof ListrRenderer>(
  basedir: string,
  provider: string,
  force: boolean,
  webAuthn: boolean
): ListrTask<never, Renderer> => {
  return {
    title: 'Generating auth api side files...',
    task: (_ctx: never, task: ListrTaskWrapper<never, Renderer>) => {
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
  }
}

export const addAuthConfigToWeb = <Renderer extends typeof ListrRenderer>(
  basedir: string,
  provider: string,
  webAuthn = false
) => ({
  title: 'Adding auth config to web...',
  task: (_ctx: never, task: ListrTaskWrapper<never, Renderer>) => {
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

export const addAuthConfigToGqlApi = <Renderer extends typeof ListrRenderer>(
  authDecoderImport?: string
) => ({
  title: 'Adding auth config to GraphQL API...',
  task: (_ctx: never, task: ListrTaskWrapper<never, Renderer>) => {
    if (graphFunctionDoesExist()) {
      addApiConfig(authDecoderImport)
    } else {
      task.skip?.('GraphQL function not found, skipping')
    }
  },
})

export const addWebPackages = (webPackages: string[]) => ({
  title: 'Adding required web packages...',
  task: async () => {
    await execa('yarn', ['workspace', 'web', 'add', ...webPackages])
  },
})

export const addApiPackages = (apiPackages: string[]) => ({
  title: 'Adding required api packages...',
  task: async () => {
    await execa('yarn', ['workspace', 'api', 'add', ...apiPackages])
  },
})

export const installPackages = {
  title: 'Installing packages...',
  task: async () => {
    await execa('yarn', ['install'])
  },
}
