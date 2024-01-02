global.__dirname = __dirname

jest.mock('fs')

import path from 'path'

// Load mocks
import '../../../../lib/test'

const realfs = jest.requireActual('fs')
import Enquirer from 'enquirer'
import fs from 'fs-extra'

import { getPaths } from '../../../../lib'
import * as dbAuth from '../dbAuth'

// Mock files needed for each test
const mockFiles = {}

const dbAuthTemplateFiles = [
  'forgotPassword.tsx.template',
  'login.tsx.template',
  'login.webAuthn.tsx.template',
  'resetPassword.tsx.template',
  'signup.tsx.template',
]
dbAuthTemplateFiles.forEach((templateFilename) => {
  mockFiles[path.join(__dirname, `../templates/${templateFilename}`)] = realfs
    .readFileSync(path.join(__dirname, `../templates/${templateFilename}`))
    .toString()
})

mockFiles[
  path.join(__dirname, `../../scaffold/templates/assets/scaffold.css.template`)
] = realfs
  .readFileSync(
    path.join(
      __dirname,
      `../../scaffold/templates/assets/scaffold.css.template`
    )
  )
  .toString()

mockFiles[getPaths().web.routes] = realfs
  .readFileSync(
    path.join(
      __dirname,
      `../../../../../../../__fixtures__/example-todo-main/web/src/Routes.js`
    )
  )
  .toString()

mockFiles[getPaths().web.app] = realfs
  .readFileSync(
    path.join(
      __dirname,
      `../../../../../../../__fixtures__/example-todo-main/web/src/App.js`
    )
  )
  .toString()

describe('dbAuth', () => {
  beforeEach(() => {
    fs.__setMockFiles(mockFiles)
  })

  it('creates a login page', () => {
    expect(dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'),
    ])
  })

  it('creates a signup page', () => {
    expect(dbAuth.files(true, false)).toHaveProperty([
      path.normalize(
        '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
      ),
    ])
  })

  it('creates a scaffold CSS file', () => {
    expect(dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/scaffold.css'),
    ])
  })

  describe('handler', () => {
    it('exits when all files are skipped', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation()
      const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation()

      await dbAuth.handler({
        listr2: { silentRendererCondition: true },
        usernameLabel: 'email',
        passwordLabel: 'password',
        webauthn: false,
        skipForgot: true,
        skipLogin: true,
        skipReset: true,
        skipSignup: true,
      })

      expect(mockConsoleInfo.mock.calls[0]).toMatchSnapshot()
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
      mockConsoleInfo.mockRestore()
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
        listr2: { silentRendererCondition: true },
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
        listr2: { silentRendererCondition: true },
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
        listr2: { silentRendererCondition: true },
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
        listr2: { silentRendererCondition: true },
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
        listr2: { silentRendererCondition: true },
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
        listr2: { silentRendererCondition: true },
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
        listr2: { silentRendererCondition: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
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
        listr2: { silentRendererCondition: true },
        usernameLabel: 'Email',
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
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
        listr2: { silentRendererCondition: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
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
        listr2: { silentRendererCondition: true },
        passwordLabel: 'Secret',
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
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
        listr2: { silentRendererCondition: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
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
        listr2: { silentRendererCondition: true },
        usernameLabel: 'Email',
        passwordLabel: 'Secret',
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
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
        listr2: { silentRendererCondition: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
        .toString()
      expect(signupPage).toMatchSnapshot()
    })

    it('produces the correct files with custom username and password set via prompt and with webauthn enabled via flag', async () => {
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
        listr2: { silentRendererCondition: true },
        webauthn: true,
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
        .toString()
      expect(signupPage).toMatchSnapshot()
    })

    it('produces the correct files with custom username and password set via prompt and with webauthn enabled via prompt', async () => {
      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('username label')) {
          prompt.value = 'Email'
        }
        if (prompt.state.message.includes('password label')) {
          prompt.value = 'Secret'
        }
        if (prompt.state.message.includes('Enable WebAuthn')) {
          prompt.value = true
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        listr2: { silentRendererCondition: true },
      })

      const forgotPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx'
          )
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'
          )
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx'
          )
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx'
          )
        )
        .toString()
      expect(signupPage).toMatchSnapshot()
    })
  })
})
