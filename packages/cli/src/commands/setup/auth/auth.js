import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import terminalLink from 'terminal-link'

import { standardAuthBuilder } from '@redwoodjs/cli-helpers'

import { getPaths } from '../../../lib/'

function redirectCommand(provider) {
  return [
    provider,
    false,
    () => {},
    () => {
      console.log(getRedirectMessage(provider))
    },
  ]
}

export const command = 'auth <provider>'

export const description = 'Generate an auth configuration'

// Don't forget to update test-project setup if you change something here
export async function builder(yargs) {
  yargs
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-auth'
      )}`
    )
    // Command "redirects" for auth providers we used to support
    .command(...redirectCommand('ethereum'))
    .command(...redirectCommand('goTrue'))
    .command(...redirectCommand('magicLink'))
    .command(...redirectCommand('nhost'))
    .command(...redirectCommand('okta'))
    // Providers we support
    .command(
      'auth0',
      'Generate an auth configuration for Auth0',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const handler = await getAuthHandler('@redwoodjs/auth-auth0-setup')
        handler(args)
      }
    )
    .command(
      'azure-active-directory',
      'Generate an auth configuration for Azure Active Directory',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const handler = await getAuthHandler(
          '@redwoodjs/auth-azure-active-directory-setup'
        )
        handler(args)
      }
    )
    .command(
      'clerk',
      'Generate an auth configuration for Clerk',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const handler = await getAuthHandler('@redwoodjs/auth-clerk-setup')
        handler(args)
      }
    )
    .command(
      'custom',
      'Generate a custom auth configuration',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const handler = await getAuthHandler('@redwoodjs/auth-custom-setup')
        handler(args)
      }
    )
    .command(
      'dbAuth',
      'Generate an auth configuration for dbAuth',
      (yargs) => {
        return standardAuthBuilder(yargs).option('webauthn', {
          alias: 'w',
          default: null,
          description: 'Include WebAuthn support (TouchID/FaceID)',
          type: 'boolean',
        })
      },
      async (args) => {
        const handler = await getAuthHandler('@redwoodjs/auth-dbauth-setup')
        handler(args)
      }
    )
    .command(
      'firebase',
      'Generate an auth configuration for Firebase',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const handler = await getAuthHandler('@redwoodjs/auth-firebase-setup')
        handler(args)
      }
    )
    .command(
      'netlify',
      'Generate an auth configuration for Netlify',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const handler = await getAuthHandler('@redwoodjs/auth-netlify-setup')
        handler(args)
      }
    )
    .command(
      'supabase',
      'Generate an auth configuration for Supabase',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const handler = await getAuthHandler('@redwoodjs/auth-supabase-setup')
        handler(args)
      }
    )
    .command(
      'supertokens',
      'Generate an auth configuration for SuperTokens',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const handler = await getAuthHandler(
          '@redwoodjs/auth-supertokens-setup'
        )
        handler(args)
      }
    )
}

/**
 * Get a stock message for one of our removed auth providers
 * directing the user to the Custom Auth docs.
 *
 * @param {string} provider
 */
function getRedirectMessage(provider) {
  return `${provider} is no longer supported out of the box. But you can still integrate it yourself with ${terminalLink(
    'Custom Auth',
    'https://redwoodjs.com/docs/canary/auth/custom'
  )}`
}

async function getAuthHandler(module) {
  // Here we're reading this package's (@redwoodjs/cli) package.json.
  // So, in a user's project, `packageJsonPath` will be something like...
  // /Users/bob/tmp/rw-app/node_modules/@redwoodjs/cli/package.json
  const packageJsonPath = path.resolve(__dirname, '../../../../package.json')
  let { version } = fs.readJSONSync(packageJsonPath)

  if (!isInstalled(module)) {
    const { stdout } = await execa.command(
      `yarn npm info ${module} --fields versions --json`
    )

    // If the version includes a plus, like '4.0.0-rc.428+dd79f1726'
    // (all @canary, @next, and @rc packages do), get rid of everything after the plus.
    if (version.includes('+')) {
      version = version.split('+')[0]
    }

    const versionIsPublished = JSON.parse(stdout).versions.includes(version)

    if (!versionIsPublished) {
      // Fallback to canary. This is most likely because it's a new package
      version = 'canary'
    }

    // We use `version` to make sure we install the same version of the auth
    // setup package as the rest of the RW packages
    await execa.command(`yarn add -D ${module}@${version}`, {
      stdio: 'inherit',
      cwd: getPaths().base,
    })
  }

  const { handler } = await import(module)

  return handler
}

/**
 * Check if a user's project's has a module listed as a dependency or devDependency.
 *
 * @param {string} module
 * @returns {boolean}
 */
function isInstalled(module) {
  const { dependencies, devDependencies } = fs.readJSONSync(
    path.join(getPaths().base, 'package.json')
  )

  return Object.hasOwn(
    {
      ...dependencies,
      ...devDependencies,
    },
    module
  )
}
