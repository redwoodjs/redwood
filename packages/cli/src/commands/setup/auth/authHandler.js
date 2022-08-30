import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import prompts from 'prompts'

import { errorTelemetry } from '@redwoodjs/telemetry'

import {
  getPaths,
  writeFilesTask,
  transformTSToJS,
  getGraphqlPath,
  graphFunctionDoesExist,
} from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

const AUTH_PROVIDER_IMPORT = `import { AuthProvider } from '@redwoodjs/auth'`

const OUTPUT_PATHS = {
  auth: path.join(
    getPaths().api.lib,
    isTypeScriptProject() ? 'auth.ts' : 'auth.js'
  ),
  function: path.join(
    getPaths().api.functions,
    isTypeScriptProject() ? 'auth.ts' : 'auth.js'
  ),
}

const WEBAUTHN_SUPPORTED_PROVIDERS = ['dbAuth']

const getWebAppPath = () => getPaths().web.app

const getTemplates = () =>
  fs
    .readdirSync(path.resolve(__dirname, 'templates'))
    .reduce((templates, file) => {
      if (file === 'auth.ts.template') {
        return {
          ...templates,
          base: [path.resolve(__dirname, 'templates', file)],
        }
      } else {
        const provider = file.split('.')[0]
        if (templates[provider]) {
          templates[provider].push(path.resolve(__dirname, 'templates', file))
          return { ...templates }
        } else {
          return {
            ...templates,
            [provider]: [path.resolve(__dirname, 'templates', file)],
          }
        }
      }
    }, {})

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

// returns the content of App.{js,tsx} with <AuthProvider> updated
const updateWebRender = (content, authProvider) => {
  const props = objectToComponentProps(authProvider)
  const renderContent = `<AuthProvider ${props.join(' ')}>`

  return content.replace(/<AuthProvider.*type=['"](.*)['"]>/s, renderContent)
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
    /<AuthProvider.*type=['"](.*)['"]/s
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
const checkAuthProviderExists = async () => {
  const content = fs.readFileSync(getWebAppPath()).toString()

  if (content.includes(AUTH_PROVIDER_IMPORT)) {
    throw new Error(
      'Existing auth provider found.\nUse --force to override existing provider.'
    )
  }
}

// the files to create to support auth
export const files = ({ provider, webAuthn }) => {
  const templates = getTemplates()
  let files = {}

  // look for any templates for this provider
  for (const [templateProvider, templateFiles] of Object.entries(templates)) {
    if (provider === templateProvider) {
      templateFiles.forEach((templateFile) => {
        const shouldUseTemplate =
          (webAuthn && templateFile.match(/\.webAuthn\./)) ||
          (!webAuthn && !templateFile.match(/\.webAuthn\./))

        if (shouldUseTemplate) {
          const outputPath =
            OUTPUT_PATHS[path.basename(templateFile).split('.')[1]]
          const content = fs.readFileSync(templateFile).toString()
          files = Object.assign(files, {
            [outputPath]: isTypeScriptProject()
              ? content
              : transformTSToJS(outputPath, content),
          })
        }
      })
    }
  }

  // if there are no provider-specific templates, just use the base auth one
  if (Object.keys(files).length === 0) {
    const content = fs.readFileSync(templates.base[0]).toString()
    files = {
      [OUTPUT_PATHS.auth]: isTypeScriptProject()
        ? content
        : transformTSToJS(templates.base[0], content),
    }
  }

  return files
}

// actually inserts the required config lines into App.{js,tsx}
export const addConfigToApp = async (config, force, options = {}) => {
  const { webAppPath: customWebAppPath } = options || {}

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

export const addApiConfig = () => {
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

export const isProviderSupported = (provider) => {
  return getSupportedProviders().indexOf(provider) !== -1
}

export const apiSrcDoesExist = () => {
  return fs.existsSync(path.join(getPaths().api.src))
}

export const webIndexDoesExist = () => {
  return fs.existsSync(getWebAppPath())
}

export const handler = async (yargs) => {
  const { provider, rwVersion, webauthn } = yargs
  let force = yargs.force
  let includeWebAuthn = webauthn
  let providerData

  // check if api/src/lib/auth.js already exists and if so, ask the user to overwrite
  if (force === false) {
    if (fs.existsSync(Object.keys(files(provider, yargs))[0])) {
      const forceResponse = await prompts({
        type: 'confirm',
        name: 'answer',
        message: `Overwrite existing ${getPaths().api.lib.replace(
          getPaths().base,
          ''
        )}/auth.[jt]s?`,
        initial: false,
      })
      force = forceResponse.answer
    }
  }

  // only dbAuth supports WebAuthn right now, but in theory it could work with
  // any provider, so we'll do a check here and potentially use any the webAuthn
  // version of its provider
  if (
    includeWebAuthn === null &&
    WEBAUTHN_SUPPORTED_PROVIDERS.includes(provider)
  ) {
    const webAuthnResponse = await prompts({
      type: 'confirm',
      name: 'answer',
      message: `Enable WebAuthn support (TouchID/FaceID)? See https://redwoodjs.com/docs/auth/dbAuth#webAuthn`,
      initial: false,
    })
    includeWebAuthn = webAuthnResponse.answer
  }

  if (includeWebAuthn) {
    providerData = await import(`./providers/${provider}.webAuthn`)
  } else {
    providerData = await import(`./providers/${provider}`)
  }

  const tasks = new Listr(
    [
      {
        title: 'Generating auth lib...',
        task: (_ctx, task) => {
          if (apiSrcDoesExist()) {
            return writeFilesTask(
              files({ ...yargs, webAuthn: includeWebAuthn }),
              {
                overwriteExisting: force,
              }
            )
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
            task.skip('web/src/App.{js,tsx} not found, skipping')
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
            `@redwoodjs/auth@${rwVersion}`,
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
      providerData.task,
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
      await checkAuthProviderExists()
    }

    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
