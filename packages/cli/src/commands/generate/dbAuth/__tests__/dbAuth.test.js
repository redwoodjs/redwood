global.__dirname = __dirname

vi.mock('fs-extra')

import path from 'path'

// Load mocks
import '../../../../lib/test'

const realfs = await vi.importActual('fs-extra')
import Enquirer from 'enquirer'
import fs from 'fs-extra'
import { vol } from 'memfs'
import { vi, describe, it, expect, beforeEach } from 'vitest'

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
      `../../scaffold/templates/assets/scaffold.css.template`,
    ),
  )
  .toString()

mockFiles[getPaths().web.routes] = realfs
  .readFileSync(
    path.join(
      __dirname,
      `../../../../../../../__fixtures__/example-todo-main/web/src/Routes.js`,
    ),
  )
  .toString()

mockFiles[getPaths().web.app] = realfs
  .readFileSync(
    path.join(
      __dirname,
      `../../../../../../../__fixtures__/example-todo-main/web/src/App.js`,
    ),
  )
  .toString()

describe('dbAuth', () => {
  beforeEach(() => {
    delete mockFiles[path.join(getPaths().web.src, 'auth.ts')]
    delete mockFiles[path.join(getPaths().web.src, 'auth.tsx')]
    delete mockFiles[path.join(getPaths().web.src, 'auth.js')]
    delete mockFiles[path.join(getPaths().web.src, 'auth.jsx')]

    vol.reset()
    vol.fromJSON(mockFiles)
  })

  it('creates a login page', async () => {
    expect(await dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'),
    ])
  })

  it('creates a signup page', async () => {
    expect(await dbAuth.files(true, false)).toHaveProperty([
      path.normalize(
        '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
      ),
    ])
  })

  it('creates a scaffold CSS file', async () => {
    expect(await dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/scaffold.css'),
    ])
  })

  describe('handler', () => {
    it('exits when all files are skipped', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation()
      const mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation()

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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
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
            '/path/to/project/web/src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx',
          ),
        )
        .toString()
      expect(forgotPasswordPage).toMatchSnapshot()

      const loginPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/LoginPage/LoginPage.jsx',
          ),
        )
        .toString()
      expect(loginPage).toMatchSnapshot()

      const resetPasswordPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/ResetPasswordPage/ResetPasswordPage.jsx',
          ),
        )
        .toString()
      expect(resetPasswordPage).toMatchSnapshot()

      const signupPage = fs
        .readFileSync(
          path.normalize(
            '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
          ),
        )
        .toString()
      expect(signupPage).toMatchSnapshot()
    })
  })

  describe('isDbAuthSetup', () => {
    it('works with js file', () => {
      mockFiles[path.join(getPaths().web.src, 'auth.js')] = `
import { createDbAuthClient, createAuth } from '@redwoodjs/auth-dbauth-web'

const dbAuthClient = createDbAuthClient()

export const { AuthProvider, useAuth } = createAuth(dbAuthClient)
`
      vol.reset()
      vol.fromJSON(mockFiles)

      expect(dbAuth.isDbAuthSetup()).toBeTruthy()
    })

    it('works with ts file', () => {
      mockFiles[path.join(getPaths().web.src, 'auth.ts')] = `
import { createDbAuthClient, createAuth } from '@redwoodjs/auth-dbauth-web'

const dbAuthClient = createDbAuthClient()

export const { AuthProvider, useAuth } = createAuth(dbAuthClient)
`
      vol.reset()
      vol.fromJSON(mockFiles)

      expect(dbAuth.isDbAuthSetup()).toBeTruthy()
    })

    it('works with jsx file and renamed import', () => {
      mockFiles[path.join(getPaths().web.src, 'auth.jsx')] = `
import { createDbAuthClient, createAuth: renamedCreateAuth } from '@redwoodjs/auth-dbauth-web'

const dbAuthClient = createDbAuthClient()

const { AuthProvider, useAuth } = renamedCreateAuth(dbAuthClient)

const CustomAuthProvider = ({ children }) => {
  return (
    <div className="custom-auth-provider">
      <AuthProvider>{children}</AuthProvider>
    </div>
  )
}

export const AuthProvider = CustomAuthProvider
export { useAuth }
`
      vol.reset()
      vol.fromJSON(mockFiles)

      expect(dbAuth.isDbAuthSetup()).toBeTruthy()
    })

    it("Doesn't give false positives", () => {
      mockFiles[path.join(getPaths().web.src, 'auth.jsx')] = `
import React, { useEffect } from 'react'

import { ClerkProvider, useUser } from '@clerk/clerk-react'

import { createAuth } from '@redwoodjs/auth-clerk-web'
import { navigate } from '@redwoodjs/router'

export const { AuthProvider: ClerkRwAuthProvider, useAuth } = createAuth()

const ClerkProviderWrapper = ({ children, clerkOptions }) => {
  const { reauthenticate } = useAuth()

  return (
    <ClerkProvider
      {...clerkOptions}
      navigate={(to) => reauthenticate().then(() => navigate(to))}
    >
      {children}
    </ClerkProvider>
  )
}

export const AuthProvider = ({ children }: Props) => {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY

  return (
    <ClerkRwAuthProvider>
      <ClerkProviderWrapper clerkOptions={{ publishableKey }}>
        {children}
      </ClerkProviderWrapper>
    </ClerkRwAuthProvider>
  )
}

`
      vol.reset()
      vol.fromJSON(mockFiles)

      expect(dbAuth.isDbAuthSetup()).toBeFalsy()
    })

    it('Detects dbAuth in the test-project', () => {
      mockFiles[path.join(getPaths().web.src, 'auth.js')] = realfs.readFileSync(
        path.join(
          __dirname,
          `../../../../../../../__fixtures__/test-project/web/src/auth.ts`,
        ),
        'utf-8',
      )
      vol.reset()
      vol.fromJSON(mockFiles)

      expect(dbAuth.isDbAuthSetup()).toBeTruthy()
    })
  })
})
