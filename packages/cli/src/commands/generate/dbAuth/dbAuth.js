import path from 'path'

import { camelCase } from 'camel-case'
import Enquirer from 'enquirer'
import fs from 'fs-extra'
import { Listr } from 'listr2'
import terminalLink from 'terminal-link'
import { titleCase } from 'title-case'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import {
  addRoutesToRouterTask,
  addScaffoldImport,
  generateTemplate,
  getPaths,
  transformTSToJS,
  writeFilesTask,
} from '../../../lib'
import c from '../../../lib/colors'
import { prepareForRollback } from '../../../lib/rollback'
import { yargsDefaults } from '../helpers'
import { templateForComponentFile } from '../helpers'

const ROUTES = [
  `<Route path="/login" page={LoginPage} name="login" />`,
  `<Route path="/signup" page={SignupPage} name="signup" />`,
  `<Route path="/forgot-password" page={ForgotPasswordPage} name="forgotPassword" />`,
  `<Route path="/reset-password" page={ResetPasswordPage} name="resetPassword" />`,
]

const POST_INSTALL =
  `   ${c.warning("Pages created! But you're not done yet:")}\n\n` +
  `   You'll need to tell your pages where to redirect after a user has logged in,\n` +
  `   signed up, or reset their password. Look in LoginPage, SignupPage,\n` +
  `   ForgotPasswordPage and ResetPasswordPage for these lines: \n\n` +
  `     if (isAuthenticated) {\n` +
  `       navigate(routes.home())\n` +
  `     }\n\n` +
  `   and change the route to where you want them to go if the user is already\n` +
  `   logged in. Also take a look in the onSubmit() functions in ForgotPasswordPage\n` +
  `   and ResetPasswordPage to change where the user redirects to after submitting\n` +
  `   those forms.\n\n` +
  `   Oh, and if you haven't already, add the necessary dbAuth functions and\n` +
  `   app setup by running:\n\n` +
  `     yarn rw setup auth dbAuth\n\n` +
  `   Happy authenticating!\n`

const WEBAUTHN_POST_INSTALL =
  `   ${c.warning("Pages created! But you're not done yet:")}\n\n` +
  "   You'll need to tell your pages where to redirect after a user has logged in,\n" +
  '   signed up, or reset their password. In LoginPage, look for the `REDIRECT`\n' +
  `   constant and change the route if it's something other than home().\n` +
  `   In SignupPage, ForgotPasswordPage and ResetPasswordPage look for these lines:\n\n` +
  `     if (isAuthenticated) {\n` +
  `       navigate(routes.home())\n` +
  `     }\n\n` +
  `   and change the route to where you want them to go if the user is already\n` +
  `   logged in. Also take a look in the onSubmit() functions in ForgotPasswordPage\n` +
  `   and ResetPasswordPage to change where the user redirects to after submitting\n` +
  `   those forms.\n\n` +
  `   Oh, and if you haven't already, add the necessary dbAuth functions and\n` +
  `   app setup by running:\n\n` +
  `     yarn rw setup auth dbAuth\n\n` +
  `   Happy authenticating!\n`

export const command = 'dbAuth'
export const description =
  'Generate Login, Signup and Forgot Password pages for dbAuth'
export const builder = (yargs) => {
  yargs
    .option('skip-forgot', {
      description: 'Skip generating the Forgot Password page',
      type: 'boolean',
      default: false,
    })
    .option('skip-login', {
      description: 'Skip generating the login page',
      type: 'boolean',
      default: false,
    })
    .option('skip-reset', {
      description: 'Skip generating the Reset Password page',
      type: 'boolean',
      default: false,
    })
    .option('skip-signup', {
      description: 'Skip generating the signup page',
      type: 'boolean',
      default: false,
    })
    .option('webauthn', {
      alias: 'w',
      default: null,
      description: 'Include WebAuthn support (TouchID/FaceID)',
      type: 'boolean',
    })
    .option('username-label', {
      default: null,
      description: 'Override default form label for username field',
      type: 'string',
    })
    .option('password-label', {
      default: null,
      description: 'Override default form label for password field',
      type: 'string',
    })
    .option('rollback', {
      description: 'Revert all generator actions if an error occurs',
      type: 'boolean',
      default: true,
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/authentication#self-hosted-auth-installation-and-setup'
      )}`
    )

  // Merge generator defaults in
  Object.entries(yargsDefaults).forEach(([option, config]) => {
    yargs.option(option, config)
  })
}

export const files = ({
  _tests,
  typescript,
  skipForgot,
  skipLogin,
  skipReset,
  skipSignup,
  webauthn,
  usernameLabel,
  passwordLabel,
}) => {
  const files = []

  usernameLabel = usernameLabel || 'username'
  passwordLabel = passwordLabel || 'password'

  const templateVars = {
    usernameLowerCase: usernameLabel.toLowerCase(),
    usernameCamelCase: camelCase(usernameLabel),
    usernameTitleCase: titleCase(usernameLabel),
    passwordLowerCase: passwordLabel.toLowerCase(),
    passwordCamelCase: camelCase(passwordLabel),
    passwordTitleCase: titleCase(passwordLabel),
  }

  if (!skipForgot) {
    files.push(
      templateForComponentFile({
        name: 'ForgotPassword',
        suffix: 'Page',
        extension: typescript ? '.tsx' : '.jsx',
        webPathSection: 'pages',
        generator: 'dbAuth',
        templatePath: 'forgotPassword.tsx.template',
        templateVars,
      })
    )
  }

  if (!skipLogin) {
    files.push(
      templateForComponentFile({
        name: 'Login',
        suffix: 'Page',
        extension: typescript ? '.tsx' : '.jsx',
        webPathSection: 'pages',
        generator: 'dbAuth',
        templatePath: webauthn
          ? 'login.webAuthn.tsx.template'
          : 'login.tsx.template',
        templateVars,
      })
    )
  }

  if (!skipReset) {
    files.push(
      templateForComponentFile({
        name: 'ResetPassword',
        suffix: 'Page',
        extension: typescript ? '.tsx' : '.jsx',
        webPathSection: 'pages',
        generator: 'dbAuth',
        templatePath: 'resetPassword.tsx.template',
        templateVars,
      })
    )
  }

  if (!skipSignup) {
    files.push(
      templateForComponentFile({
        name: 'Signup',
        suffix: 'Page',
        extension: typescript ? '.tsx' : '.jsx',
        webPathSection: 'pages',
        generator: 'dbAuth',
        templatePath: 'signup.tsx.template',
        templateVars,
      })
    )
  }

  if (files.length === 0) {
    console.info(c.error('\nNo files to generate.\n'))
    process.exit(0)
  }

  // add scaffold CSS file if it doesn't exist already
  const scaffoldOutputPath = path.join(getPaths().web.src, 'scaffold.css')
  if (!fs.existsSync(scaffoldOutputPath)) {
    const scaffoldTemplate = generateTemplate(
      path.join(
        __dirname,
        '../scaffold/templates/assets/scaffold.css.template'
      ),
      { name: 'scaffold' }
    )

    files.push([scaffoldOutputPath, scaffoldTemplate])
  }

  return files.reduce((acc, [outputPath, content]) => {
    let template = content

    if (outputPath.match(/\.[jt]sx?/) && !typescript) {
      template = transformTSToJS(outputPath, content)
    }

    return {
      [outputPath]: template,
      ...acc,
    }
  }, {})
}

const tasks = ({
  enquirer,
  listr2,
  force,
  tests,
  typescript,
  skipForgot,
  skipLogin,
  skipReset,
  skipSignup,
  webauthn,
  usernameLabel,
  passwordLabel,
}) => {
  return new Listr(
    [
      {
        title: 'Determining UI labels...',
        skip: () => {
          return usernameLabel && passwordLabel
        },
        task: async (ctx, task) => {
          return task.newListr([
            {
              title: 'Username label',
              task: async (subctx, subtask) => {
                if (usernameLabel) {
                  subtask.skip(
                    `Argument username-label is set, using: "${usernameLabel}"`
                  )
                  return
                }
                usernameLabel = await subtask.prompt({
                  type: 'input',
                  name: 'username',
                  message: 'What would you like the username label to be:',
                  default: 'Username',
                })
                subtask.title = `Username label: "${usernameLabel}"`
              },
            },
            {
              title: 'Password label',
              task: async (subctx, subtask) => {
                if (passwordLabel) {
                  subtask.skip(
                    `Argument password-label passed, using: "${passwordLabel}"`
                  )
                  return
                }
                passwordLabel = await subtask.prompt({
                  type: 'input',
                  name: 'password',
                  message: 'What would you like the password label to be:',
                  default: 'Password',
                })
                subtask.title = `Password label: "${passwordLabel}"`
              },
            },
          ])
        },
      },
      {
        title: 'Querying WebAuthn addition...',
        task: async (ctx, task) => {
          if (webauthn != null) {
            task.skip(
              `Querying WebAuthn addition: argument webauthn passed, WebAuthn ${
                webauthn ? '' : 'not'
              } included`
            )
            return
          }
          const response = await task.prompt({
            type: 'confirm',
            name: 'answer',
            message: `Enable WebAuthn support (TouchID/FaceID) on LoginPage? See https://redwoodjs.com/docs/auth/dbAuth#webAuthn`,
            default: false,
          })
          webauthn = response
          task.title = `Querying WebAuthn addition: WebAuthn addition ${
            webauthn ? '' : 'not'
          } included`
        },
      },
      {
        title: 'Creating pages...',
        task: async () => {
          return writeFilesTask(
            files({
              tests,
              typescript,
              skipForgot,
              skipLogin,
              skipReset,
              skipSignup,
              webauthn,
              usernameLabel,
              passwordLabel,
            }),
            {
              overwriteExisting: force,
            }
          )
        },
      },
      {
        title: 'Adding routes...',
        task: async () => {
          addRoutesToRouterTask(ROUTES)
        },
      },
      {
        title: 'Adding scaffold import...',
        task: () => addScaffoldImport(),
      },
      {
        title: 'One more thing...',
        task: () => {
          // This doesn't preserve formatting, so it's been moved to regular
          // console.log()s after the tasks have all finished running
          // task.title = webauthn ? WEBAUTHN_POST_INSTALL : POST_INSTALL
        },
      },
    ],
    {
      silentRendererCondition: () => listr2?.silentRendererCondition,
      rendererOptions: { collapseSubtasks: false },
      injectWrapper: { enquirer: enquirer || new Enquirer() },
      exitOnError: true,
    }
  )
}

export const handler = async (yargs) => {
  recordTelemetryAttributes({
    command: 'generate dbAuth',
    skipForgot: yargs.skipForgot,
    skipLogin: yargs.skipLogin,
    skipReset: yargs.skipReset,
    skipSignup: yargs.skipSignup,
    webauthn: yargs.webauthn,
    force: yargs.force,
    rollback: yargs.rollback,
  })
  const t = tasks({ ...yargs })

  try {
    if (yargs.rollback && !yargs.force) {
      prepareForRollback(t)
    }
    await t.run()
    console.log('')
    console.log(yargs.webauthn ? WEBAUTHN_POST_INSTALL : POST_INSTALL)
  } catch (e) {
    console.log(c.error(e.message))
  }
}
