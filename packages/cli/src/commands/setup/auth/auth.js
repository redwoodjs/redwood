import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import prompts from 'prompts'
import terminalLink from 'terminal-link'

import { standardAuthBuilder } from '@redwoodjs/cli-helpers'

import { getPaths } from '../../../lib/'
import c from '../../../lib/colors'

export const command = 'auth <provider>'

export const description = 'Generate an auth configuration'

// Don't forget to update test-project setup if you change something here
export async function builder(yargs) {
  async function printExperimentalWarning(argv, yargs) {
    if (!argv.warn) {
      return
    }

    console.log(
      c.warning(
        [
          '',
          "You're running the experimental @canary version of auth. It might",
          'be broken, and after running this command you will not be able to',
          'downgrade to a stable version of Redwood without breaking your',
          'auth setup. Please only use this version of auth in throwaway',
          'projects. For a more stable experience, but still updated with the',
          "latest patches, try switching to Redwood's @next version by",
          'running `yarn rw upgrade -t next`',
          '',
        ].join('\n')
      )
    )

    const response = await prompts({
      type: 'confirm',
      name: 'answer',
      message: 'Do you want to continue?',
      initial: false,
    })

    if (!response.answer) {
      yargs.exit(1)
    }
  }

  yargs
    .middleware([printExperimentalWarning])
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-auth'
      )}`
    )
    // Command "redirects" for auth providers we used to support
    .command(
      'ethereum',
      false,
      () => {},
      () => {
        console.log(
          'ethereum is no longer supported out of the box. But you can still integrate it yourself with custom auth'
        )
      }
    )
    .command(
      'goTrue',
      false,
      () => {},
      () => {
        console.log(
          'goTrue is no longer supported out of the box. But you can still integrate it yourself with custom auth'
        )
      }
    )
    .command(
      'magicLink',
      false,
      () => {},
      () => {
        console.log(
          'magicLink is no longer supported out of the box. But you can still integrate it yourself with custom auth'
        )
      }
    )
    .command(
      'nhost',
      false,
      () => {},
      () => {
        console.log(
          'nhost is no longer supported out of the box. But you can still integrate it yourself with custom auth'
        )
      }
    )
    .command(
      'okta',
      false,
      () => {},
      () => {
        console.log(
          'okta is no longer supported out of the box. But you can still integrate it yourself with custom auth'
        )
      }
    )
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
      'dbauth',
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
