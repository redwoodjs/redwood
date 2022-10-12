global.__dirname = __dirname

jest.mock('fs')

import fs from 'fs'
import path from 'path'

// Load mocks
import '../../../../lib/test'

const realfs = jest.requireActual('fs')
import Enquirer from 'enquirer'

import { getPaths } from '../../../../lib'
import * as dbAuth from '../dbAuth'

describe('dbAuth', () => {
  beforeEach(() => {
    // dbAuth template files
    const templateFilenames = [
      'forgotPassword.tsx.template',
      'login.tsx.template',
      'login.webAuthn.tsx.template',
      'resetPassword.tsx.template',
      'signup.tsx.template',
    ]
    let mockFiles = {}
    templateFilenames.forEach((templateFilename) => {
      mockFiles[path.join(__dirname, `../templates/${templateFilename}`)] =
        realfs
          .readFileSync(
            path.join(__dirname, `../templates/${templateFilename}`)
          )
          .toString()
    })

    // css scaffold files
    mockFiles[
      path.join(
        __dirname,
        `../../scaffold/templates/assets/scaffold.css.template`
      )
    ] = realfs
      .readFileSync(
        path.join(
          __dirname,
          `../../scaffold/templates/assets/scaffold.css.template`
        )
      )
      .toString()

    // routes file
    mockFiles[getPaths().web.routes] = [
      "import { Router, Route } from '@redwoodjs/router'",
      '',
      'const Routes = () => {',
      '  return (',
      '    <Router>',
      '      <Route path="/about" page={AboutPage} name="about" />',
      '      <Route notfound page={NotFoundPage} />',
      '    </Router>',
      '  )',
      '}',
      '',
      'export default Routes',
    ].join('\n')

    // appjs file
    mockFiles[
      getPaths().web.app
    ] = `import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
    import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

    import FatalErrorPage from 'src/pages/FatalErrorPage'
    import Routes from 'src/Routes'

    import './index.css'

    const App = () => (
      <FatalErrorBoundary page={FatalErrorPage}>
        <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
          <RedwoodApolloProvider>
            <Routes />
          </RedwoodApolloProvider>
        </RedwoodProvider>
      </FatalErrorBoundary>
    )

    export default App`

    fs.__setMockFiles(mockFiles)
  })

  it('creates a login page', () => {
    expect(dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/pages/LoginPage/LoginPage.js'),
    ])
  })

  it('creates a signup page', () => {
    expect(dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/pages/SignupPage/SignupPage.js'),
    ])
  })

  it('creates a scaffold CSS file', () => {
    expect(dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/scaffold.css'),
    ])
  })

  describe('handler', () => {
    beforeEach(() => {
      // jest.spyOn(console, 'info').mockImplementation(() => {})
      // jest.spyOn(console, 'log').mockImplementation(() => {})
    })
    afterEach(() => {
      // console.info.mockRestore()
      // console.log.mockRestore()
      // jest.restoreAllMocks()
    })

    it('prompt for username label', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer({ show: false })
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('username label')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
      })
      expect(correctPrompt).toBe(true)
    })

    it('does not prompt for username label when flag is given', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer({ show: false })
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('username label')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
        usernameLabel: 'email',
      })
      expect(correctPrompt).toBe(false)
    })

    it('prompt for password label', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer({ show: false })
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('password label')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
      })
      expect(correctPrompt).toBe(true)
    })

    it('does not prompt for password label when flag is given', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer({ show: false })
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('password label')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
        passwordLabel: 'secret',
      })
      expect(correctPrompt).toBe(false)
    })

    it('prompt for webauthn', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer({ show: false })
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('Enable WebAuthn')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
      })
      expect(correctPrompt).toBe(true)
    })

    it('does not prompt for webauthn when flag is given', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer({ show: false })
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('Enable WebAuthn')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
        webauthn: false,
      })
      expect(correctPrompt).toBe(false)
    })

    it('produces the correct files with default labels', async () => {
      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.js'
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync('/path/to/project/web/src/pages/LoginPage/LoginPage.js')
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.js'
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync('/path/to/project/web/src/pages/SignupPage/SignupPage.js')
        .toString()
      expect(signupPage).toMatchSnapshot()
    })

    it('produces the correct files with custom username set via flag', async () => {
      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
        usernameLabel: 'Email',
      })

      const forgotPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.js'
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync('/path/to/project/web/src/pages/LoginPage/LoginPage.js')
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.js'
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync('/path/to/project/web/src/pages/SignupPage/SignupPage.js')
        .toString()
      expect(signupPage).toMatchSnapshot()
    })

    it('produces the correct files with custom username set via prompt', async () => {
      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('username label')) {
          prompt.value = 'Email'
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.js'
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync('/path/to/project/web/src/pages/LoginPage/LoginPage.js')
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.js'
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync('/path/to/project/web/src/pages/SignupPage/SignupPage.js')
        .toString()
      expect(signupPage).toMatchSnapshot()
    })

    it('produces the correct files with custom password set via flag', async () => {
      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
        passwordLabel: 'Secret',
      })

      const forgotPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.js'
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync('/path/to/project/web/src/pages/LoginPage/LoginPage.js')
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.js'
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync('/path/to/project/web/src/pages/SignupPage/SignupPage.js')
        .toString()
      expect(signupPage).toMatchSnapshot()
    })

    it('produces the correct files with custom password set via prompt', async () => {
      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('password label')) {
          prompt.value = 'Secret'
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.js'
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync('/path/to/project/web/src/pages/LoginPage/LoginPage.js')
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.js'
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync('/path/to/project/web/src/pages/SignupPage/SignupPage.js')
        .toString()
      expect(signupPage).toMatchSnapshot()
    })

    it('produces the correct files with custom username and password set via flag', async () => {
      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
        usernameLabel: 'Email',
        passwordLabel: 'Secret',
      })

      const forgotPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.js'
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync('/path/to/project/web/src/pages/LoginPage/LoginPage.js')
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.js'
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync('/path/to/project/web/src/pages/SignupPage/SignupPage.js')
        .toString()
      expect(signupPage).toMatchSnapshot()
    })

    it('produces the correct files with custom username and password set via prompt', async () => {
      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('username label')) {
          prompt.value = 'Email'
        }
        if (prompt.state.message.includes('password label')) {
          prompt.value = 'Secret'
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { rendererSilent: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.js'
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync('/path/to/project/web/src/pages/LoginPage/LoginPage.js')
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.js'
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync('/path/to/project/web/src/pages/SignupPage/SignupPage.js')
        .toString()
      expect(signupPage).toMatchSnapshot()
    })
  })
})
