import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { ListrRenderer, ListrTask, ListrTaskWrapper } from 'listr2'

import { transformTSToJS, writeFilesTask } from '../lib'
import { colors } from '../lib/colors'
import { getPaths, resolveFile } from '../lib/paths'
import {
  getGraphqlPath,
  graphFunctionDoesExist,
  isTypeScriptProject,
} from '../lib/project'

import { apiSideFiles, generateUniqueFileNames } from './authFiles'

const AUTH_PROVIDER_HOOK_IMPORT = `import { AuthProvider, useAuth } from './auth'`
const AUTH_HOOK_IMPORT = `import { useAuth } from './auth'`

export const getWebAppPath = () => getPaths().web.app

const addApiConfig = ({
  replaceExistingImport,
  authDecoderImport,
}: {
  replaceExistingImport: boolean
  authDecoderImport?: string
}) => {
  const graphqlPath = getGraphqlPath()

  if (!graphqlPath) {
    throw new Error('Could not find your graphql file path')
  }

  let content = fs.readFileSync(graphqlPath).toString()
  let contentUpdated = false

  // Replace the existing import { x as authDecoder} with the new one
  if (authDecoderImport && replaceExistingImport) {
    content = content.replace(
      /import { .+ as authDecoder .+/,
      authDecoderImport
    )

    contentUpdated = true
  }

  // Won't go into this block, if replaceExistingImport ran
  if (authDecoderImport && !content.includes(authDecoderImport)) {
    content = authDecoderImport + '\n' + content

    // If we have multiple auth providers setup we probably already have an
    // auth decoder configured. In that case we don't want to add another one
    // Have to use a funky looking Regex here to prevent a "Polynomial regular
    // expression used on uncontrolled data" warning/error. A.k.a "Catastrophic
    // Backtracking". The usual fix is to use an atomic group, but the JS
    // regex engine doesn't support that, so we use a lookaround group to
    // emulate an atomic group.
    if (
      !new RegExp(
        '(?=(^.*?createGraphQLHandler))\\1.*\\bauthDecoder',
        's'
      ).test(content)
    ) {
      content = content.replace(
        /^(\s*)(loggerConfig:)(.*)$/m,
        `$1authDecoder,\n$1$2$3`
      )
    }

    contentUpdated = true
  }

  const hasAuthImport =
    /(^import {.*?getCurrentUser(?!getCurrentUser).*?} from 'src\/lib\/auth')/s.test(
      content
    )

  if (!hasAuthImport) {
    // add import statement
    content = content.replace(
      /^(import { db } from 'src\/lib\/db')$/m,
      `import { getCurrentUser } from 'src/lib/auth'\n$1`
    )

    // add object to handler
    content = content.replace(
      /^(\s*)(loggerConfig:)(.*)$/m,
      `$1getCurrentUser,\n$1$2$3`
    )

    contentUpdated = true
  }

  if (contentUpdated) {
    fs.writeFileSync(graphqlPath, content)
  }
}

const apiSrcDoesExist = () => {
  return fs.existsSync(path.join(getPaths().api.src))
}

const webAppDoesExist = () => {
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
export const addConfigToWebApp = <
  Renderer extends typeof ListrRenderer
>(): ListrTask<AuthGeneratorCtx, Renderer> => {
  return {
    title: 'Updating web/src/App.{js,tsx}',
    task: (_ctx, task) => {
      if (!webAppDoesExist()) {
        throw new Error('Could not find root App.{js,tsx}')
      }

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
        task.output = colors.warning(
          'Could not find <RedwoodApolloProvider>.\nIf you are using a custom ' +
            'GraphQL Client you will have to make sure it gets access to your ' +
            '`useAuth`, if it needs it.'
        )
      }

      fs.writeFileSync(webAppPath, content)
    },
  }
}

export const createWebAuth = (templateDir: string, webAuthn: boolean) => {
  return {
    title: 'Creating web/src/auth.{js,ts}',
    task: (ctx: AuthGeneratorCtx) => {
      const templatesBaseDir = path.join(templateDir, 'templates', 'web')
      const templates = fs.readdirSync(templatesBaseDir)

      const templateFileName = templates.find((template) => {
        return template.startsWith('auth.' + (webAuthn ? 'webAuthn.ts' : 'ts'))
      })

      if (!templateFileName) {
        throw new Error('Could not find the auth.ts template')
      }

      const templateExtension = templateFileName.split('.').at(-2)

      // @MARK - finding unused file name here,
      // We should only use an unused filename, if the user is CHOOSING not to replace the existing provider

      // Find an unused filename
      // Start with web/src/auth.{ts,tsx}
      // Then web/src/providerAuth.{ts,tsx}
      // Then web/src/providerAuth2.{ts,tsx}
      // Then web/src/providerAuth3.{ts,tsx}
      // etc

      let authFileName = path.join(getPaths().web.src, 'auth')

      // Generate a unique name, when you are trying to combine providers
      if (ctx.setupMode === AuthSetupMode.COMBINE) {
        let i = 1
        while (resolveFile(authFileName)) {
          const count = i > 1 ? i : ''

          authFileName = path.join(
            getPaths().web.src,
            ctx.provider + 'Auth' + count
          )

          i++
        }
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
    },
  }
}

export const addConfigToRoutes = () => {
  return {
    title: 'Updating Routes file...',
    task: () => {
      const webRoutesPath = getPaths().web.routes

      let content = fs.readFileSync(webRoutesPath).toString()

      if (!content.includes(AUTH_HOOK_IMPORT)) {
        content = addAuthImportToRoutes(content)
      }

      if (!hasUseAuthHook('Router', content)) {
        content = addUseAuthHook('Router', content)
      }

      fs.writeFileSync(webRoutesPath, content)
    },
  }
}

/**
 * Will find the templates inside `${basedir}/templates/api`,
 * and write these files to disk with unique names if they are clashing.
 *
 * @returns Listr task
 */
export const generateAuthApiFiles = <Renderer extends typeof ListrRenderer>(
  basedir: string,
  webAuthn: boolean
): ListrTask<AuthGeneratorCtx, Renderer> => {
  return {
    title: 'Generating auth api side files...',
    task: async (ctx, task) => {
      if (!apiSrcDoesExist()) {
        return new Error(
          'Could not find api/src directory. Cannot continue setup!'
        )
      }

      // The keys in `filesRecord` are the full paths to where the file contents,
      // which is the values in `filesRecord`, will be written.
      let filesRecord = apiSideFiles({ basedir, webAuthn })

      // Always overwrite files in force mode, no need to prompt
      let overwriteAllFiles = ctx.setupMode === AuthSetupMode.FORCE

      if (ctx.setupMode === AuthSetupMode.REPLACE) {
        // Confirm that we're about to overwrite some files
        const filesToOverwrite = findExistingFiles(filesRecord)

        overwriteAllFiles = await task.prompt({
          type: 'confirm',
          message: `Overwrite existing ${filesToOverwrite.join(', ')}?`,
          initial: false,
        })
      }

      if (ctx.setupMode === AuthSetupMode.COMBINE) {
        const uniqueFilesRecord = generateUniqueFileNames(
          filesRecord,
          ctx.provider
        )

        filesRecord = uniqueFilesRecord
      }

      return writeFilesTask(filesRecord, {
        overwriteExisting: overwriteAllFiles,
      })
    },
  }
}

/**
 * Returns a map of file names (not full paths) that already exist
 */
export function findExistingFiles(filesMap: Record<string, string>) {
  return Object.keys(filesMap)
    .filter((filePath) => fs.existsSync(filePath))
    .map((filePath) => filePath.replace(getPaths().base, ''))
}

export const addAuthConfigToGqlApi = <Renderer extends typeof ListrRenderer>(
  authDecoderImport?: string
) => ({
  title: 'Adding auth config to GraphQL API...',
  task: (
    ctx: AuthGeneratorCtx,
    _task: ListrTaskWrapper<AuthGeneratorCtx, Renderer>
  ) => {
    if (graphFunctionDoesExist()) {
      addApiConfig({
        authDecoderImport,
        replaceExistingImport:
          ctx.setupMode === AuthSetupMode.REPLACE ||
          ctx.setupMode === AuthSetupMode.FORCE,
      })
    } else {
      throw new Error(
        'GraphQL function not found. You will need to pass the decoder to the createGraphQLHandler function.'
      )
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

export enum AuthSetupMode {
  FORCE = 'force', // user passed the --force flag, this is essentially replace without prompts
  REPLACE = 'replace', // replace existing auth provider, with the one being setup
  COMBINE = 'combine', // add the new auth provider along side the existing one(s)
  UNKNOWN = 'unknown', // we will prompt the user to select a mode
}
export interface AuthGeneratorCtx {
  setupMode: AuthSetupMode
  provider: string
}

export const checkIfAuthSetupAlready = <
  Renderer extends typeof ListrRenderer
>() => {
  return {
    title: 'Checking project for existing auth...',
    task: async (
      ctx: AuthGeneratorCtx,
      task: ListrTaskWrapper<AuthGeneratorCtx, Renderer>
    ) => {
      const webAppContents = fs.readFileSync(getWebAppPath(), 'utf-8')

      // If we don't know whether the user wants to replace or combine,
      // we prompt them to select a mode.
      if (
        hasAuthProvider(webAppContents) &&
        ctx.setupMode === AuthSetupMode.UNKNOWN
      ) {
        const setupMode = await task.prompt({
          type: 'select',
          message: `Looks like you have an auth provider already setup. How would you like to proceed?`,
          choices: [
            {
              message: `Replace existing auth with ${ctx.provider}`,
              value: AuthSetupMode.REPLACE, // this is the value
            },
            {
              message: `Combine existing auth with ${ctx.provider}`,
              value: AuthSetupMode.COMBINE, // this is the value
            },
          ],
        })

        // User has selected the setup mode, so we set it on the context
        // This is used in the tasks downstream
        ctx.setupMode = setupMode

        return
      } else {
        task.skip('Setting up Auth from scratch')
      }
    },
  }
}
