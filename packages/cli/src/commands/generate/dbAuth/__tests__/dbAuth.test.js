global.__dirname = __dirname
import path from 'path'

// Load mocks
import '../../../../lib/test'

import Enquirer from 'enquirer'

import * as dbAuth from '../dbAuth'

describe('dbAuth', () => {
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
      jest.spyOn(console, 'info').mockImplementation(() => {})
      jest.spyOn(console, 'log').mockImplementation(() => {})
    })
    afterEach(() => {
      console.info.mockRestore()
      console.log.mockRestore()
      jest.restoreAllMocks()
    })

    it('prompt for username label', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('username label')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({ enquirer: customEnquirer })
      expect(correctPrompt).toBe(true)
    })

    it('does not prompt for username label when flag is given', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('username label')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({ enquirer: customEnquirer, usernameLabel: 'email' })
      expect(correctPrompt).toBe(false)
    })

    it('prompt for password label', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('password label')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({ enquirer: customEnquirer })
      expect(correctPrompt).toBe(true)
    })

    it('does not prompt for password label when flag is given', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        if (prompt.state.message.includes('password label')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({
        enquirer: customEnquirer,
        passwordLabel: 'secret',
      })
      expect(correctPrompt).toBe(false)
    })

    it('prompt for webauthn', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        console.error(prompt.state.message)
        if (prompt.state.message.includes('Enable WebAuthn')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({ enquirer: customEnquirer })
      expect(correctPrompt).toBe(true)
    })

    it('does not prompt for webauthn when flag is given', async () => {
      let correctPrompt = false

      const customEnquirer = new Enquirer()
      customEnquirer.on('prompt', (prompt) => {
        console.error(prompt.state.message)
        if (prompt.state.message.includes('Enable WebAuthn')) {
          correctPrompt = true
        }
        prompt.submit()
      })

      await dbAuth.handler({ enquirer: customEnquirer, webauthn: false })
      expect(correctPrompt).toBe(false)
    })
  })
})
