import path from 'path'

import { fetch } from '@whatwg-node/fetch'
import chalk from 'chalk'
import execa from 'execa'
import fs from 'fs-extra'
import terminalLink from 'terminal-link'
import { hideBin, Parser } from 'yargs/helpers'
// import { default as yargsRaw } from 'yargs/yargs'

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

export const command = 'auth [provider]'

export const description = 'Generate an auth configuration'

// Don't forget to update test-project setup if you change something here
export async function builder(yargs) {
  yargs
    // .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-auth'
      )}`
    )
    .option('list', {
      alias: 'l',
      description: 'List all available providers',
      type: 'boolean',
      default: false,
    })
    .command(
      '$0',
      false,
      () => {},
      async (argv) => {
        // The initial checks here are workarounds for
        // https://github.com/yargs/yargs/issues/2291
        if (argv._.length > 2) {
          console.log(execa.commandSync('yarn dev setup auth --help').stdout)
          console.log(`\n${chalk.red.bold('Error:')} Too many arguments`)
          process.exit(1)
        }

        if (!argv.list) {
          console.log(execa.commandSync('yarn dev setup auth --help').stdout)
          console.log(
            `\n${chalk.red.bold('Error:')} Missing or unsupported argument(s)`
          )
          process.exit(1)
        }

        // argv.list is true - Let's fetch a list of all auth provider setup
        // packages on npm!
        console.log('')
        console.log('Fetching auth provider setup packages...')
        console.log('')

        let setupPackages = []

        try {
          const url =
            'https://registry.npmjs.org/-/v1/search?text=@redwoodjs/auth-setup'
          const result = await fetch(url)
          const data = await result.json()
          setupPackages = data.objects
            .map((o) => o.package)
            .filter(
              (p) =>
                p.name.endsWith('-setup') &&
                !p.name.endsWith('auth-providers-setup')
            )
        } catch (error) {
          console.error('Could not fetch packages', error)
        }

        console.log('These are the auth provider setup packages we support:')
        console.log(setupPackages.map((p) => `  - ${p.name}`).join('\n'))
        console.log('')
        console.log(
          'Run `yarn rw setup auth <package name>` to setup the auth ' +
            'provider integration you need'
        )
      }
    )
    .strict(false)
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
        const { handler } = await getAuthSetup('@redwoodjs/auth-auth0-setup')
        handler(args)
      }
    )
    .command(
      'azure-active-directory',
      'Generate an auth configuration for Azure Active Directory',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const { handler } = await getAuthSetup(
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
        const { handler } = await getAuthSetup('@redwoodjs/auth-clerk-setup')
        handler(args)
      }
    )
    .command(
      'custom',
      'Generate a custom auth configuration',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const { handler } = await getAuthSetup('@redwoodjs/auth-custom-setup')
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
        const { handler } = await getAuthSetup('@redwoodjs/auth-dbauth-setup')
        handler(args)
      }
    )
    .command(
      'firebase',
      'Generate an auth configuration for Firebase',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const { handler } = await getAuthSetup('@redwoodjs/auth-firebase-setup')
        handler(args)
      }
    )
    .command(
      'netlify',
      'Generate an auth configuration for Netlify',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const { handler } = await getAuthSetup('@redwoodjs/auth-netlify-setup')
        handler(args)
      }
    )
    .command(
      'supabase',
      'Generate an auth configuration for Supabase',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const { handler } = await getAuthSetup('@redwoodjs/auth-supabase-setup')
        handler(args)
      }
    )
    .command(
      'supertokens',
      'Generate an auth configuration for SuperTokens',
      (yargs) => standardAuthBuilder(yargs),
      async (args) => {
        const { handler } = await getAuthSetup(
          '@redwoodjs/auth-supertokens-setup'
        )
        handler(args)
      }
    )
    .strict(false)
    .parserConfiguration({ 'unknown-options-as-args': true })
    .command(
      '$0 <npm-package>',
      'Generate an auth configuration for the given provider',
      () => {},
      async () => {
        // Here be dragons...
        // There's no way for the user to actually end up here, but we need
        // this command to get the help output we want from yargs
      }
    )
    .command(
      '$0',
      false,
      () => {},
      async (args) => {
        // This is a workaround for https://github.com/yargs/yargs/issues/2291
        if (args._.length <= 2) {
          let helpCmd = 'yarn rw setup auth --help'

          if (/cli[\/\\]dist[\/\\]index.js/.test(process.argv[1])) {
            helpCmd = 'yarn dev setup auth --help'
          }

          console.error(execa.commandSync(helpCmd).stdout)
          process.exit(1)
        }

        console.log()
        console.log('Set up auth using', args._[2])
        console.log()

        // TODO: Figure out how to use builder
        const { handler, _builder } = await getAuthSetup(args._[2], {
          versionStrategy: '',
        })

        // Maybe we can do something here to also use builder from above
        // const yargsParsed = yargsRaw(hideBin(process.argv))
        //   // Config
        //   .scriptName('rw')
        //   .command('setup auth <provider>')
        //   .parse()

        const parsed = {
          ...args,
          ...Parser(hideBin(process.argv)),
        }

        handler(parsed)
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

const SEMVER_REGEX =
  /(?<=^v?|\sv?)(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/i

async function getAuthSetup(module, { versionStrategy = 'MATCH' } = {}) {
  if (versionStrategy === 'MATCH') {
    return getMatchingAuthSetup(module)
  }

  const splitName = module.split('@')
  if (splitName.length >= 2 && SEMVER_REGEX.test(splitName.at(-1))) {
    return getSpecificAuthSetup(module)
  }

  return getLatestAuthSetup(module)
}

async function getSpecificAuthSetup(module) {
  execa.commandAsync(`yarn add -D ${module}`, {
    stdio: 'inherit',
    cwd: getPaths().base,
  })

  return await import(module)
}

async function getLatestAuthSetup(module) {
  const { stdout } = execa.commandSync(
    `yarn npm info ${module} --fields versions --json`
  )

  const versions = JSON.parse(stdout).versions
  const latestVersion = versions.at(-1)

  if (!isInstalled(module, latestVersion)) {
    execa.commandSync(`yarn add -D ${module}@${latestVersion}`, {
      stdio: 'inherit',
      cwd: getPaths().base,
    })
  }

  return await import(module)
}

async function getMatchingAuthSetup(module) {
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

  return await import(module)
}

/**
 * Check if a user's project's has a module listed as a dependency or devDependency.
 *
 * @param {string} module
 * @returns {boolean}
 */
function isInstalled(module, version) {
  const { dependencies, devDependencies } = fs.readJSONSync(
    path.join(getPaths().base, 'package.json')
  )

  const deps = {
    ...dependencies,
    ...devDependencies,
  }

  if (version) {
    return deps[module] === version
  }

  return Object.hasOwn(
    {
      ...dependencies,
      ...devDependencies,
    },
    module
  )
}
