import fs from 'fs'
import path from 'path'

import { Listr } from 'listr2'
import prompts from 'prompts'
import terminalLink from 'terminal-link'

import {
  addRoutesToRouterTask,
  addScaffoldImport,
  generateTemplate,
  getPaths,
  transformTSToJS,
  writeFilesTask,
} from '../../../lib'
import c from '../../../lib/colors'
import { yargsDefaults } from '../../generate'
import { templateForComponentFile } from '../helpers'

const ROUTES = [
  `<Route path="/login" page={LoginPage} name="login" />`,
  `<Route path="/signup" page={SignupPage} name="signup" />`,
  `<Route path="/forgot-password" page={ForgotPasswordPage} name="forgotPassword" />`,
  `<Route path="/reset-password" page={ResetPasswordPage} name="resetPassword" />`,
]

const POST_INSTALL =
  `One more thing...\n\n` +
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
  `One more thing...\n\n` +
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
  webAuthn,
}) => {
  const files = []

  if (!skipForgot) {
    files.push(
      templateForComponentFile({
        name: 'ForgotPassword',
        suffix: 'Page',
        extension: typescript ? '.tsx' : '.js',
        webPathSection: 'pages',
        generator: 'dbAuth',
        templatePath: 'forgotPassword.tsx.template',
      })
    )
  }

  if (!skipLogin) {
    files.push(
      templateForComponentFile({
        name: 'Login',
        suffix: 'Page',
        extension: typescript ? '.tsx' : '.js',
        webPathSection: 'pages',
        generator: 'dbAuth',
        templatePath: webAuthn
          ? 'login.webAuthn.tsx.template'
          : 'login.tsx.template',
      })
    )
  }

  if (!skipReset) {
    files.push(
      templateForComponentFile({
        name: 'ResetPassword',
        suffix: 'Page',
        extension: typescript ? '.tsx' : '.js',
        webPathSection: 'pages',
        generator: 'dbAuth',
        templatePath: 'resetPassword.tsx.template',
      })
    )
  }

  if (!skipSignup) {
    files.push(
      templateForComponentFile({
        name: 'Signup',
        suffix: 'Page',
        extension: typescript ? '.tsx' : '.js',
        webPathSection: 'pages',
        generator: 'dbAuth',
        templatePath: 'signup.tsx.template',
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
  force,
  tests,
  typescript,
  skipForgot,
  skipLogin,
  skipReset,
  skipSignup,
  webAuthn,
}) => {
  return new Listr(
    [
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
              webAuthn,
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
        task: (ctx, task) => {
          task.title = webAuthn ? WEBAUTHN_POST_INSTALL : POST_INSTALL
        },
      },
    ],
    { rendererOptions: { collapse: false }, exitOnError: true }
  )
}

export const handler = async (yargs) => {
  let includeWebAuthn = yargs.webauthn

  if (includeWebAuthn === null) {
    const response = await prompts({
      type: 'confirm',
      name: 'answer',
      message: `Enable WebAuthn support (TouchID/FaceID) on LoginPage? See https://redwoodjs.com/docs/auth/dbAuth#webAuthn`,
      initial: false,
    })
    includeWebAuthn = response.answer
  }

  const t = tasks({ ...yargs, webAuthn: includeWebAuthn })

  try {
    await t.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
