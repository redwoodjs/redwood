import CryptoJS from 'crypto-js'

import { DbAuthHandler } from '../DbAuthHandler'
import * as dbAuthError from '../errors'

// mock prisma db client
const DbMock = class {
  constructor(accessors) {
    accessors.forEach((accessor) => {
      this[accessor] = new TableMock(accessor)
    })
  }
}

// creates a mock database table accessor (db.user)
const TableMock = class {
  constructor(accessor) {
    this.accessor = accessor
    this.records = []
  }

  count() {
    return this.records.length
  }

  create({ data }) {
    if (data.id === undefined) {
      data.id = Math.round(Math.random() * 10000000)
    }
    this.records.push(data)

    return JSON.parse(JSON.stringify(data))
  }

  update({ where, data }) {
    let record = this.records.find((r) => r.id === where.id)
    const index = this.records.indexOf(record)
    const newRecord = Object.assign(record, data)
    this.records[index] = newRecord

    return JSON.parse(JSON.stringify(newRecord))
  }

  findFirst({ where }) {
    const keys = Object.keys(where)
    let matchingRecords = this.records
    keys.forEach((key) => {
      matchingRecords = matchingRecords.filter(
        (record) => record[key] === where[key]
      )
    })
    return matchingRecords[0]
  }

  findUnique({ where }) {
    return this.records.find((record) => {
      const key = Object.keys(where)[0]
      return record[key] === where[key]
    })
  }

  deleteMany() {
    const count = this.records.length
    this.records = []
    return count
  }
}

// create a mock `db` provider that simulates prisma creating/finding/deleting records
const db = new DbMock(['user'])

const UUID_REGEX =
  /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
const SET_SESSION_REGEX = /^session=[a-zA-Z0-9+=/]+;/
const UTC_DATE_REGEX = /\w{3}, \d{2} \w{3} \d{4} [\d:]{8} GMT/
const LOGOUT_COOKIE =
  'session=;Path=/;HttpOnly;SameSite=Strict;Secure;Expires=Thu, 01 Jan 1970 00:00:00 GMT'

const createDbUser = async (attributes = {}) => {
  return await db.user.create({
    data: {
      email: 'rob@redwoodjs.com',
      hashedPassword:
        '0c2b24e20ee76a887eac1415cc2c175ff961e7a0f057cead74789c43399dd5ba',
      salt: '2ef27f4073c603ba8b7807c6de6d6a89',
      ...attributes,
    },
  })
}

const expectLoggedOutResponse = (response) => {
  expect(response[1]['Set-Cookie']).toEqual(LOGOUT_COOKIE)
}

const expectLoggedInResponse = (response) => {
  expect(response[1]['Set-Cookie']).toMatch(SET_SESSION_REGEX)
}

const encryptToCookie = (data) => {
  return `session=${CryptoJS.AES.encrypt(data, process.env.SESSION_SECRET)}`
}

let event, context, options

describe('dbAuth', () => {
  beforeEach(() => {
    // hide deprecation warnings during test
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    // encryption key so results are consistent regardless of settings in .env
    process.env.SESSION_SECRET = 'nREjs1HPS7cFia6tQHK70EWGtfhOgbqJQKsHQz3S'
    delete process.env.DBAUTH_COOKIE_DOMAIN

    event = {
      queryStringParameters: {},
      path: '/.redwood/functions/auth',
      headers: {},
    }
    context = {}

    options = {
      authModelAccessor: 'user',
      authFields: {
        id: 'id',
        username: 'email',
        hashedPassword: 'hashedPassword',
        salt: 'salt',
        resetToken: 'resetToken',
        resetTokenExpiresAt: 'resetTokenExpiresAt',
      },
      db: db,
      excludeUserFields: [],
      forgotPassword: {
        handler: (user) => user,
        expires: 10,
      },
      login: {
        handler: (user) => user,
        errors: {
          usernameOrPasswordMissing: 'Both username and password are required',
          usernameNotFound: 'Username ${username} not found',
          incorrectPassword: 'Incorrect password for ${username}',
        },
        expires: 60 * 60,
      },
      resetPassword: {
        handler: (user) => user,
        allowReusedPassword: false,
      },
      signup: {
        handler: ({ username, hashedPassword, salt, userAttributes }) => {
          return db.user.create({
            data: {
              email: username,
              hashedPassword: hashedPassword,
              salt: salt,
              name: userAttributes.name,
            },
          })
        },
        errors: {
          fieldMissing: '${field} is required',
          usernameTaken: 'Username `${username}` already in use',
        },
      },
    }
  })

  afterEach(async () => {
    jest.spyOn(console, 'warn').mockRestore()
    await db.user.deleteMany({
      where: { email: 'rob@redwoodjs.com' },
    })
  })

  describe('CSRF_TOKEN', () => {
    it('returns a UUID', () => {
      expect(DbAuthHandler.CSRF_TOKEN).toMatch(UUID_REGEX)
    })

    it('returns a unique UUID after each call', () => {
      const first = DbAuthHandler.CSRF_TOKEN
      const second = DbAuthHandler.CSRF_TOKEN

      expect(first).not.toMatch(second)
    })
  })

  describe('PAST_EXPIRES_DATE', () => {
    it('returns the start of epoch as a UTCString', () => {
      expect(DbAuthHandler.PAST_EXPIRES_DATE).toEqual(
        new Date('1970-01-01T00:00:00.000+00:00').toUTCString()
      )
    })
  })

  describe('dbAccessor', () => {
    it('returns the prisma db accessor for a model', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      expect(dbAuth.dbAccessor).toEqual(db.user)
    })
  })

  describe('_futureExpiresDate', () => {
    it('returns a date in the future as a UTCString', () => {
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._futureExpiresDate).toMatch(UTC_DATE_REGEX)
    })
  })

  describe('_deleteSessionHeader', () => {
    it('returns a Set-Cookie header to delete the session cookie', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const headers = dbAuth._deleteSessionHeader

      expect(Object.keys(headers).length).toEqual(1)
      expect(Object.keys(headers)).toContain('Set-Cookie')
      expect(headers['Set-Cookie']).toEqual(LOGOUT_COOKIE)
    })
  })

  describe('constructor', () => {
    it('initializes some variables with passed values', () => {
      event = { headers: {} }
      context = { foo: 'bar' }
      options = {
        db: db,
        forgotPassword: {
          handler: () => {},
        },
        login: {
          handler: () => {},
          expires: 1,
        },
        resetPassword: {
          handler: () => {},
        },
        signup: {
          handler: () => {},
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.event).toEqual(event)
      expect(dbAuth.context).toEqual(context)
      expect(dbAuth.options).toEqual(options)
    })

    it('throws an error if no forgotPassword.handler option', () => {
      expect(
        () =>
          new DbAuthHandler(event, context, {
            login: {
              handler: () => {},
              expires: 1,
            },
            resetPassword: {
              handler: () => {},
            },
            signup: {
              handler: () => {},
            },
          })
      ).toThrow(dbAuthError.NoForgotPasswordHandler)

      expect(
        () =>
          new DbAuthHandler(event, context, {
            forgotPassword: {},
            login: {
              handler: () => {},
              expires: 1,
            },
            resetPassword: {
              handler: () => {},
            },
            signup: {
              handler: () => {},
            },
          })
      ).toThrow(dbAuthError.NoForgotPasswordHandler)
    })

    it('throws an error if login expiration time is not defined', () => {
      // login object doesn't exist at all
      expect(
        () =>
          new DbAuthHandler(event, context, {
            forgotPassword: {
              handler: () => {},
            },
            resetPassword: {
              handler: () => {},
            },
            signup: {
              handler: () => {},
            },
          })
      ).toThrow(dbAuthError.NoSessionExpirationError)
      // login object exists, but not `expires` key
      expect(
        () =>
          new DbAuthHandler(event, context, {
            forgotPassword: {
              handler: () => {},
            },
            login: {
              handler: () => {},
            },
            resetPassword: {
              handler: () => {},
            },
            signup: {
              handler: () => {},
            },
          })
      ).toThrow(dbAuthError.NoSessionExpirationError)
    })

    it('throws an error if no login.handler option', () => {
      expect(
        () =>
          new DbAuthHandler(event, context, {
            forgotPassword: {
              handler: () => {},
            },
            login: {
              expires: 1,
            },
            resetPassword: {
              handler: () => {},
            },
            signup: {
              handler: () => {},
            },
          })
      ).toThrow(dbAuthError.NoLoginHandlerError)
    })

    it('throws an error if no signup.handler option', () => {
      expect(
        () =>
          new DbAuthHandler(event, context, {
            forgotPassword: {
              handler: () => {},
            },
            login: {
              handler: () => {},
              expires: 1,
            },
            resetPassword: {
              handler: () => {},
            },
          })
      ).toThrow(dbAuthError.NoSignupHandler)

      expect(
        () =>
          new DbAuthHandler(event, context, {
            forgotPassword: {
              handler: () => {},
            },
            login: {
              handler: () => {},
              expires: 1,
            },
            resetPassword: {
              handler: () => {},
            },
            signup: {},
          })
      ).toThrow(dbAuthError.NoSignupHandler)
    })

    it('parses params from a plain text body', () => {
      event = { headers: {}, body: `{"foo":"bar", "baz":123}` }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.params).toEqual({ foo: 'bar', baz: 123 })
    })

    it('parses an empty plain text body and still sets params', () => {
      event = { isBase64Encoded: false, headers: {}, body: '' }
      context = { foo: 'bar' }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.params).toEqual({})
    })

    it('parses params from an undefined body when isBase64Encoded == false', () => {
      event = {
        isBase64Encoded: false,
        headers: {},
      }
      context = { foo: 'bar' }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.params).toEqual({})
    })

    it('parses params from a base64 encoded body', () => {
      event = {
        isBase64Encoded: true,
        headers: {},
        body: Buffer.from(`{"foo":"bar", "baz":123}`, 'utf8'),
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.params).toEqual({ foo: 'bar', baz: 123 })
    })

    it('parses params from an undefined body when isBase64Encoded == true', () => {
      event = {
        isBase64Encoded: true,
        headers: {},
      }
      context = { foo: 'bar' }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.params).toEqual({})
    })

    it('parses params from an empty body when isBase64Encoded == true', () => {
      event = {
        isBase64Encoded: true,
        headers: {},
        body: '',
      }
      context = { foo: 'bar' }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.params).toEqual({})
    })

    it('sets header-based CSRF token', () => {
      event = { headers: { 'csrf-token': 'qwerty' } }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.headerCsrfToken).toEqual('qwerty')
    })

    it('sets session variables to nothing if session cannot be decrypted', () => {
      event = { headers: { 'csrf-token': 'qwerty' } }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.session).toBeUndefined()
      expect(dbAuth.sessionCsrfToken).toBeUndefined()
    })

    it('sets session variables to valid session data', () => {
      event = {
        headers: {
          cookie:
            'session=U2FsdGVkX1/zRHVlEQhffsOufy7VLRAR6R4gb818vxblQQJFZI6W/T8uzxNUbQMx',
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.session).toEqual({ foo: 'bar' })
      expect(dbAuth.sessionCsrfToken).toEqual('abcd')
    })

    it('throws an error if SESSION_SECRET is not defined', () => {
      delete process.env.SESSION_SECRET

      expect(() => new DbAuthHandler(event, context, options)).toThrow(
        dbAuthError.NoSessionSecretError
      )
    })
  })

  describe('invoke', () => {
    it('returns a logout response if session is not valid', async () => {
      event.body = JSON.stringify({ method: 'logout' })
      event.httpMethod = 'GET'
      event.headers.cookie = 'session=invalid'
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = await dbAuth.invoke()

      expect(response.headers['Set-Cookie']).toEqual(LOGOUT_COOKIE)
    })

    it('returns a 404 if using the wrong HTTP verb', async () => {
      event.body = JSON.stringify({ method: 'logout' })
      event.httpMethod = 'GET'
      event.headers.cookie =
        'session=U2FsdGVkX1/zRHVlEQhffsOufy7VLRAR6R4gb818vxblQQJFZI6W/T8uzxNUbQMx'
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = await dbAuth.invoke()

      expect(response.statusCode).toEqual(404)
    })

    it('returns a 404 for unsupported method name', async () => {
      event.body = JSON.stringify({ method: 'foobar' })
      event.httpMethod = 'POST'
      event.headers.cookie =
        'session=U2FsdGVkX1/zRHVlEQhffsOufy7VLRAR6R4gb818vxblQQJFZI6W/T8uzxNUbQMx'
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = await dbAuth.invoke()

      expect(response.statusCode).toEqual(404)
    })

    it('returns a 400 for any other errors', async () => {
      event.body = JSON.stringify({ method: 'logout' })
      event.httpMethod = 'POST'
      event.headers.cookie =
        'session=U2FsdGVkX1/zRHVlEQhffsOufy7VLRAR6R4gb818vxblQQJFZI6W/T8uzxNUbQMx'
      const dbAuth = new DbAuthHandler(event, context, options)
      dbAuth.logout = jest.fn(() => {
        throw Error('Logout error')
      })
      const response = await dbAuth.invoke()

      expect(response.statusCode).toEqual(400)
      expect(response.body).toEqual('{"error":"Logout error"}')
    })

    it('calls the appropriate auth function', async () => {
      event.body = JSON.stringify({ method: 'logout' })
      event.httpMethod = 'POST'
      event.headers.cookie =
        'session=U2FsdGVkX1/zRHVlEQhffsOufy7VLRAR6R4gb818vxblQQJFZI6W/T8uzxNUbQMx'
      const dbAuth = new DbAuthHandler(event, context, options)
      dbAuth.logout = jest.fn(() => ['body', { foo: 'bar' }])
      const response = await dbAuth.invoke()

      expect(dbAuth.logout).toHaveBeenCalled()
      expect(response.statusCode).toEqual(200)
      expect(response.body).toEqual('body')
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        foo: 'bar',
      })
    })
  })

  describe('forgotPassword', () => {
    it('throws an error if username is blank', async () => {
      // missing completely
      event.body = JSON.stringify({})
      let dbAuth = new DbAuthHandler(event, context, options)

      dbAuth.forgotPassword().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameRequiredError)
      })

      // empty string
      event.body = JSON.stringify({ username: ' ' })
      dbAuth = new DbAuthHandler(event, context, options)

      dbAuth.forgotPassword().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameRequiredError)
      })

      expect.assertions(2)
    })

    it('throws an error if username is not found', async () => {
      // missing completely
      event.body = JSON.stringify({
        username: 'notfound',
      })
      let dbAuth = new DbAuthHandler(event, context, options)

      dbAuth.forgotPassword().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameNotFoundError)
      })
      expect.assertions(1)
    })

    it('sets the resetToken and resetTokenExpiresAt on the user', async () => {
      const user = await createDbUser()
      event.body = JSON.stringify({
        username: user.email,
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(user.resetToken).toEqual(undefined)
      expect(user.resetTokenExpiresAt).toEqual(undefined)

      const response = await dbAuth.forgotPassword()
      const responseBody = JSON.parse(response[0])
      const resetUser = await db.user.findUnique({
        where: { id: user.id },
      })

      expect(resetUser.resetToken).not.toEqual(undefined)
      // base64 characters only, except =
      expect(resetUser.resetToken).toMatch(/^\w{16}$/)
      expect(resetUser.resetTokenExpiresAt instanceof Date).toEqual(true)
      // response contains the user data, minus `hashedPassword` and `salt`
      expect(responseBody.id).toEqual(resetUser.id)
      expect(responseBody.email).toEqual(resetUser.email)
      expect(responseBody.resetToken).toEqual(resetUser.resetToken)
      expect(responseBody.resetTokenExpiresAt).toEqual(
        resetUser.resetTokenExpiresAt.toISOString()
      )
      expect(responseBody.hashedPassword).toEqual(undefined)
      expect(responseBody.salt).toEqual(undefined)
    })

    it('returns a logout session cookie', async () => {
      const user = await createDbUser()
      event.body = JSON.stringify({
        username: user.email,
      })
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = await dbAuth.forgotPassword()

      expectLoggedOutResponse(response)
    })

    it('invokes forgotPassword.handler() with the user', async () => {
      const user = await createDbUser()
      event.body = JSON.stringify({
        username: user.email,
      })
      options.forgotPassword.handler = (handlerUser) => {
        expect(handlerUser.id).toEqual(user.id)
      }
      const dbAuth = new DbAuthHandler(event, context, options)
      await dbAuth.forgotPassword()
      expect.assertions(1)
    })
  })

  describe('login', () => {
    it('throws an error if username is not found', async () => {
      await createDbUser()
      event.body = JSON.stringify({
        username: 'missing@redwoodjs.com',
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth.login().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UserNotFoundError)
      })
      expect.assertions(1)
    })

    it('throws an error if password is wrong', async () => {
      await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'incorrect',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth.login().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.IncorrectPasswordError)
      })
      expect.assertions(1)
    })

    it('throws an error if login.handler throws', async () => {
      const _user = await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })
      options.login.handler = () => {
        throw new Error('Cannot log in')
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth.login().catch((e) => {
        expect(e).toBeInstanceOf(Error)
      })
      expect.assertions(1)
    })

    it('passes the found user to login.handler', async () => {
      const user = await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })
      options.login.handler = () => {
        expect(user).toEqual(user)
        return user
      }
      const dbAuth = new DbAuthHandler(event, context, options)
      await dbAuth.login()
    })

    it('throws an error if login.handler returns null', async () => {
      const _user = await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })
      options.login.handler = () => {
        return null
      }
      const dbAuth = new DbAuthHandler(event, context, options)
      dbAuth.login().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.NoUserIdError)
      })
      expect.assertions(1)
    })

    it('throws an error if login.handler returns an object without an id', async () => {
      const _user = await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })
      options.login.handler = () => {
        return { name: 'Rob' }
      }
      const dbAuth = new DbAuthHandler(event, context, options)
      try {
        await dbAuth.login()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.NoUserIdError)
      }
      expect.assertions(1)
    })

    it('returns a JSON body of the user that is logged in', async () => {
      const user = await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      const response = await dbAuth.login()

      expect(response[0]).toEqual({ id: user.id })
    })

    it('returns a CSRF token in the header', async () => {
      await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      const response = await dbAuth.login()
      expect(response[1]['csrf-token']).toMatch(UUID_REGEX)
    })

    it('returns a set-cookie header to create session', async () => {
      await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      const response = await dbAuth.login()

      expect(response[1]['csrf-token']).toMatch(UUID_REGEX)
    })

    it('returns a CSRF token in the header', async () => {
      await createDbUser()
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      const response = await dbAuth.login()

      expectLoggedInResponse(response)
    })
  })

  describe('logout', () => {
    it('returns set-cookie header for removing session', async () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = dbAuth.logout()

      expectLoggedOutResponse(response)
    })
  })

  describe('resetPassword', () => {
    it('throws an error if resetToken is blank', async () => {
      // missing completely
      event.body = JSON.stringify({})
      let dbAuth = new DbAuthHandler(event, context, options)

      try {
        await dbAuth.resetPassword()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.ResetTokenRequiredError)
      }

      // empty string
      event.body = JSON.stringify({ resetToken: ' ' })
      dbAuth = new DbAuthHandler(event, context, options)

      try {
        await dbAuth.resetPassword()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.ResetTokenRequiredError)
      }

      expect.assertions(2)
    })

    it('throws an error if password is blank', async () => {
      // missing completely
      event.body = JSON.stringify({ resetToken: '1234' })
      let dbAuth = new DbAuthHandler(event, context, options)

      dbAuth.resetPassword().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.PasswordRequiredError)
      })

      // empty string
      event.body = JSON.stringify({ resetToken: '1234', password: ' ' })
      dbAuth = new DbAuthHandler(event, context, options)

      try {
        await dbAuth.resetPassword()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.PasswordRequiredError)
      }

      expect.assertions(2)
    })

    it('throws an error if no user found with resetToken', async () => {
      event.body = JSON.stringify({ resetToken: '1234', password: 'password' })
      let dbAuth = new DbAuthHandler(event, context, options)

      try {
        await dbAuth.resetPassword()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.ResetTokenInvalidError)
      }
      expect.assertions(1)
    })

    it('throws an error if resetToken is expired', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires - 1
      )
      await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })

      event.body = JSON.stringify({ resetToken: '1234', password: 'password1' })
      let dbAuth = new DbAuthHandler(event, context, options)

      try {
        await dbAuth.resetPassword()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.ResetTokenExpiredError)
      }
      expect.assertions(1)
    })

    it('clears out resetToken and resetTokenExpiresAt if expired', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires - 1
      )
      const user = await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })

      event.body = JSON.stringify({
        resetToken: '1234',
        password: 'password1',
      })
      let dbAuth = new DbAuthHandler(event, context, options)

      try {
        await dbAuth.resetPassword()
      } catch (e) {
        const expiredUser = await db.user.findUnique({
          where: { id: user.id },
        })
        expect(expiredUser.resetToken).toEqual(null)
        expect(expiredUser.resetTokenExpiresAt).toEqual(null)
      }
      expect.assertions(2)
    })

    it('throws allowReusedPassword is false and new password is same as old', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires + 1
      )
      await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })

      event.body = JSON.stringify({
        resetToken: '1234',
        password: 'password',
      })
      options.resetPassword.allowReusedPassword = false
      let dbAuth = new DbAuthHandler(event, context, options)

      await expect(dbAuth.resetPassword()).rejects.toThrow(
        dbAuthError.ReusedPasswordError
      )
    })

    it('does not throw if allowReusedPassword is true and new password is same as old', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires + 1
      )
      await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })

      event.body = JSON.stringify({
        resetToken: '1234',
        password: 'password',
      })
      options.resetPassword.allowReusedPassword = true
      let dbAuth = new DbAuthHandler(event, context, options)

      await expect(dbAuth.resetPassword()).resolves.not.toThrow()
    })

    it('updates the users password', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires + 1
      )
      const user = await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })
      event.body = JSON.stringify({
        resetToken: '1234',
        password: 'new-password',
      })
      let dbAuth = new DbAuthHandler(event, context, options)

      await expect(dbAuth.resetPassword()).resolves.not.toThrow()

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      })

      expect(updatedUser.hashedPassword).not.toEqual(user.hashedPassword)
      // should not change salt
      expect(updatedUser.salt).toEqual(user.salt)
    })

    it('clears resetToken and resetTokenExpiresAt', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires + 1
      )
      const user = await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })
      event.body = JSON.stringify({
        resetToken: '1234',
        password: 'new-password',
      })
      let dbAuth = new DbAuthHandler(event, context, options)

      await expect(dbAuth.resetPassword()).resolves.not.toThrow()

      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
      })

      expect(updatedUser.resetToken).toEqual(null)
      expect(updatedUser.resetTokenExpiresAt).toEqual(null)
    })

    it('invokes resetPassword.handler() with the user', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires + 1
      )
      const user = await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })
      event.body = JSON.stringify({
        resetToken: '1234',
        password: 'new-password',
      })
      options.resetPassword.handler = (handlerUser) => {
        expect(handlerUser.id).toEqual(user.id)
      }
      let dbAuth = new DbAuthHandler(event, context, options)

      await dbAuth.resetPassword()
      expect.assertions(1)
    })

    it('returns a logout response if handler returns falsy', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires + 1
      )
      await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })
      event.body = JSON.stringify({
        resetToken: '1234',
        password: 'new-password',
      })
      options.resetPassword.handler = () => false
      let dbAuth = new DbAuthHandler(event, context, options)

      const response = await dbAuth.resetPassword()

      expectLoggedOutResponse(response)
    })

    it('returns a login response if handler returns falsy', async () => {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() - options.forgotPassword.expires + 1
      )
      await createDbUser({
        resetToken: '1234',
        resetTokenExpiresAt: tokenExpires,
      })
      event.body = JSON.stringify({
        resetToken: '1234',
        password: 'new-password',
      })
      options.resetPassword.handler = () => true
      let dbAuth = new DbAuthHandler(event, context, options)

      const response = await dbAuth.resetPassword()

      expectLoggedInResponse(response)
    })
  })

  describe('signup', () => {
    it('bubbles up any error that is raised', async () => {
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
        name: 'Rob',
      })
      options.signup.handler = () => {
        throw Error('Cannot signup')
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      try {
        await dbAuth.signup()
      } catch (e) {
        expect(e.message).toEqual('Cannot signup')
      }
      expect.assertions(1)
    })

    it('creates a new user and logs them in', async () => {
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
        name: 'Rob',
      })
      const oldUserCount = await db.user.count()
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = await dbAuth.signup()
      const newUserCount = await db.user.count()

      expect(newUserCount).toEqual(oldUserCount + 1)
      // returns the user's ID
      expect(response[0].id).not.toBeNull()
      // logs them in
      expectLoggedInResponse(response)
      // 201 Created
      expect(response[2].statusCode).toEqual(201)
    })

    it('returns a message if a string is returned and does not log in', async () => {
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
        name: 'Rob',
      })
      options.signup.handler = () => {
        return 'Hello, world'
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      const response = await dbAuth.signup()

      // returns message
      expect(response[0]).toEqual('{"message":"Hello, world"}')
      // does not log them in
      expect(response[1]['Set-Cookie']).toBeUndefined()
      // 201 Created
      expect(response[2].statusCode).toEqual(201)
    })
  })

  describe('getToken', () => {
    it('returns the ID of the logged in user', async () => {
      const user = await createDbUser()
      event = {
        headers: {
          cookie: encryptToCookie(
            JSON.stringify({ id: user.id }) + ';' + 'token'
          ),
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = await dbAuth.getToken()

      expect(response[0]).toEqual(user.id)
    })

    it('returns nothing if user is not logged in', async () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = await dbAuth.getToken()

      expect(response[0]).toEqual('')
    })

    it('returns any other error', async () => {
      event = {
        headers: {
          cookie: encryptToCookie(
            JSON.stringify({ id: 9999999999 }) + ';' + 'token'
          ),
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = await dbAuth.getToken()

      expect(response[0]).toEqual('{"error":"User not found"}')
    })
  })

  describe('_cookieAttributes', () => {
    // DEPRECATED: cookie config should come from options object now
    it('returns an array of attributes for the session cookie', () => {
      const dbAuth = new DbAuthHandler(
        { headers: { referer: 'http://test.host' } },
        context,
        options
      )
      const attributes = dbAuth._cookieAttributes({})

      expect(attributes.length).toEqual(5)
      expect(attributes[0]).toEqual('Path=/')
      // expect(attributes[1]).toEqual('Domain=site.test')
      expect(attributes[1]).toEqual('HttpOnly')
      expect(attributes[2]).toEqual('SameSite=Strict')
      expect(attributes[3]).toEqual('Secure')
      expect(attributes[4]).toMatch(`Expires=`)
      expect(attributes[4]).toMatch(UTC_DATE_REGEX)
    })

    // DEPRECATED: Secure will be set or not in cookie config options
    it('does not include the Secure attribute when in development environment', () => {
      const oldEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const dbAuth = new DbAuthHandler(event, context, options)
      const attributes = dbAuth._cookieAttributes({})

      // not in its usual position
      expect(attributes[3]).not.toEqual('Secure')
      // or anywhere else
      expect(attributes.join(';')).not.toMatch(`Secure`)

      process.env.NODE_ENV = oldEnv
    })

    // DEPRECATED: Domain will be set or not in cookie config options
    it('includes a Domain in the cookie if DBAUTH_COOKIE_DOMAIN is set', () => {
      process.env.DBAUTH_COOKIE_DOMAIN = 'site.test'

      const dbAuth = new DbAuthHandler(event, context, options)
      const attributes = dbAuth._cookieAttributes({})

      expect(attributes[3]).toEqual('Domain=site.test')
    })

    it('returns an array of attributes for the session cookie', () => {
      const dbAuth = new DbAuthHandler(
        { headers: { referer: 'http://test.host' } },
        context,
        {
          ...options,
          cookie: {
            Path: '/',
            HttpOnly: true,
            SameSite: 'Strict',
            Secure: true,
            Domain: 'example.com',
          },
        }
      )
      const attributes = dbAuth._cookieAttributes({})

      expect(attributes.length).toEqual(6)
      expect(attributes[0]).toEqual('Path=/')
      expect(attributes[1]).toEqual('HttpOnly')
      expect(attributes[2]).toEqual('SameSite=Strict')
      expect(attributes[3]).toEqual('Secure')
      expect(attributes[4]).toEqual('Domain=example.com')
      expect(attributes[5]).toMatch(`Expires=`)
      expect(attributes[5]).toMatch(UTC_DATE_REGEX)
    })

    it('includes just a key if option set to `true`', () => {
      const dbAuth = new DbAuthHandler(event, context, {
        ...options,
        cookie: { Secure: true },
      })
      const attributes = dbAuth._cookieAttributes({})

      expect(attributes[0]).toEqual('Secure')
    })

    it('does not include a key if option set to `false`', () => {
      const dbAuth = new DbAuthHandler(event, context, {
        ...options,
        cookie: { Secure: false },
      })
      const attributes = dbAuth._cookieAttributes({})

      expect(attributes[0]).not.toEqual('Secure')
    })

    it('includes key=value if property value is set', () => {
      const dbAuth = new DbAuthHandler(event, context, {
        ...options,
        cookie: { Domain: 'example.com' },
      })
      const attributes = dbAuth._cookieAttributes({})

      expect(attributes[0]).toEqual('Domain=example.com')
    })
  })

  describe('_createSessionHeader()', () => {
    it('returns a Set-Cookie header', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const headers = dbAuth._createSessionHeader({ foo: 'bar' }, 'abcd')

      expect(Object.keys(headers).length).toEqual(1)
      expect(headers['Set-Cookie']).toMatch(
        `;Path=/;HttpOnly;SameSite=Strict;Secure;Expires=${dbAuth._futureExpiresDate}`
      )
      // can't really match on the session value since it will change on every render,
      // due to CSRF token generation but we can check that it contains a only the
      // characters that would be returned by the hash function
      expect(headers['Set-Cookie']).toMatch(SET_SESSION_REGEX)
      // and we can check that it's a certain number of characters
      expect(headers['Set-Cookie'].split(';')[0].length).toEqual(72)
    })
  })

  describe('_validateCsrf()', () => {
    it('returns true if session and header token match', () => {
      const data = { foo: 'bar' }
      const token = 'abcd'
      event = {
        headers: {
          cookie: encryptToCookie(JSON.stringify(data) + ';' + token),
          'csrf-token': token,
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._validateCsrf()).toEqual(true)
    })

    it('throws an error if session and header token do not match', () => {
      const data = { foo: 'bar' }
      const token = 'abcd'
      event = {
        headers: {
          cookie: encryptToCookie(JSON.stringify(data) + ';' + token),
          'csrf-token': 'invalid',
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(() => {
        dbAuth._validateCsrf()
      }).toThrow(dbAuthError.CsrfTokenMismatchError)
    })
  })

  describe('_verifyUser()', () => {
    it('throws an error if username is missing', async () => {
      const dbAuth = new DbAuthHandler(event, context, options)

      try {
        await dbAuth._verifyUser(null, 'password')
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      }
      try {
        await dbAuth._verifyUser('', 'password')
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      }
      try {
        await dbAuth._verifyUser(' ', 'password')
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      }
      expect.assertions(3)
    })

    it('throws an error if password is missing', () => {
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._verifyUser('username').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      })
      dbAuth._verifyUser('username', null).catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      })
      dbAuth._verifyUser('username', '').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      })
      dbAuth._verifyUser('username', ' ').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      })
      expect.assertions(4)
    })

    it('can throw a custom error message', () => {
      // default error message
      const defaultMessage = options.login.errors.usernameOrPasswordMissing
      delete options.login.errors.usernameOrPasswordMissing
      const dbAuth1 = new DbAuthHandler(event, context, options)
      dbAuth1._verifyUser(null, 'password').catch((e) => {
        expect(e.message).toEqual(defaultMessage)
      })

      // custom error message
      options.login.errors.usernameOrPasswordMissing = 'Missing!'
      const customMessage = new DbAuthHandler(event, context, options)
      customMessage._verifyUser(null, 'password').catch((e) => {
        expect(e.message).toEqual('Missing!')
      })

      expect.assertions(2)
    })

    it('throws a default error message if user is not found', async () => {
      delete options.login.errors.usernameNotFound
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._verifyUser('username', 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UserNotFoundError)
        expect(e.message).toEqual('Username username not found')
      })

      expect.assertions(2)
    })

    it('throws a custom error message if user is not found', async () => {
      options.login.errors.usernameNotFound = 'Cannot find ${username}'
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._verifyUser('Alice', 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UserNotFoundError)
        expect(e.message).toEqual('Cannot find Alice')
      })

      expect.assertions(2)
    })

    it('throws a default error if password is incorrect', async () => {
      delete options.login.errors.incorrectPassword
      const dbUser = await createDbUser()
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._verifyUser(dbUser.email, 'incorrect').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.IncorrectPasswordError)
        expect(e.message).toEqual(`Incorrect password for ${dbUser.email}`)
      })

      expect.assertions(2)
    })

    it('throws a custom error if password is incorrect', async () => {
      options.login.errors.incorrectPassword = 'Wrong password for ${username}'
      const dbUser = await createDbUser()
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._verifyUser(dbUser.email, 'incorrect').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.IncorrectPasswordError)
        expect(e.message).toEqual(`Wrong password for ${dbUser.email}`)
      })

      expect.assertions(2)
    })

    it('returns the user with matching username and password', async () => {
      const dbUser = await createDbUser()
      const dbAuth = new DbAuthHandler(event, context, options)
      const user = await dbAuth._verifyUser(dbUser.email, 'password')

      expect(user.id).toEqual(dbUser.id)
    })
  })

  describe('_getCurrentUser()', () => {
    it('throw an error if user is not logged in', async () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      dbAuth._getCurrentUser().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.NotLoggedInError)
      })
      expect.assertions(1)
    })

    it('throw an error if user is not found', async () => {
      const data = { id: 999999999999 }
      event = {
        headers: {
          cookie: encryptToCookie(JSON.stringify(data) + ';' + 'token'),
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._getCurrentUser().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UserNotFoundError)
      })
      expect.assertions(1)
    })

    it('returns the user whos id is in session', async () => {
      const dbUser = await createDbUser()
      event = {
        headers: {
          cookie: encryptToCookie(
            JSON.stringify({ id: dbUser.id }) + ';' + 'token'
          ),
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)
      const user = await dbAuth._getCurrentUser()

      expect(user.id).toEqual(dbUser.id)
    })
  })

  describe('_createUser()', () => {
    it('throws a default error message if username is already taken', async () => {
      const defaultMessage = options.signup.errors.usernameTaken
      delete options.signup.errors.usernameTaken
      const dbUser = await createDbUser()
      event.body = JSON.stringify({
        username: dbUser.email,
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._createUser().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.DuplicateUsernameError)
        expect(e.message).toEqual(
          defaultMessage.replace(/\$\{username\}/, dbUser.email)
        )
      })
      expect.assertions(2)
    })

    it('throws a custom error message if username is already taken', async () => {
      options.signup.errors.usernameTaken = '${username} taken'
      const dbUser = await createDbUser()
      event.body = JSON.stringify({
        username: dbUser.email,
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._createUser().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.DuplicateUsernameError)
        expect(e.message).toEqual(`${dbUser.email} taken`)
      })
      expect.assertions(2)
    })

    it('throws a default error message if username is missing', async () => {
      const defaultMessage = options.signup.errors.fieldMissing
      delete options.signup.errors.fieldMissing
      event.body = JSON.stringify({
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._createUser().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.FieldRequiredError)
        expect(e.message).toEqual(
          defaultMessage.replace(/\$\{field\}/, 'username')
        )
      })
      expect.assertions(2)
    })

    it('throws a custom error message if username is missing', async () => {
      options.signup.errors.fieldMissing = '${field} blank'
      event.body = JSON.stringify({
        password: 'password',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._createUser().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.FieldRequiredError)
        expect(e.message).toEqual('username blank')
      })
      expect.assertions(2)
    })

    it('throws a default error message if password is missing', async () => {
      const defaultMessage = options.signup.errors.fieldMissing
      delete options.signup.errors.fieldMissing
      event.body = JSON.stringify({
        username: 'user@redwdoodjs.com',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._createUser().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.FieldRequiredError)
        expect(e.message).toEqual(
          defaultMessage.replace(/\$\{field\}/, 'password')
        )
      })
      expect.assertions(2)
    })

    it('throws a custom error message if password is missing', async () => {
      options.signup.errors.fieldMissing = '${field} blank'
      event.body = JSON.stringify({
        username: 'user@redwdoodjs.com',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._createUser().catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.FieldRequiredError)
        expect(e.message).toEqual('password blank')
      })
      expect.assertions(2)
    })

    it('creates a new user', async () => {
      event.headers = { 'Content-Type': 'application/json' }
      event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
        name: 'Rob',
      })
      const dbAuth = new DbAuthHandler(event, context, options)

      try {
        const user = await dbAuth._createUser()
        expect(user.email).toEqual('rob@redwoodjs.com')
        expect(user.hashedPassword).not.toBeNull()
        expect(user.salt).not.toBeNull()
        expect(user.name).toEqual('Rob')
      } catch (e) {
        console.info(e)
      }
    })
  })

  describe('hashPassword', () => {
    it('hashes a password with a given salt and returns both', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const [hash, salt] = dbAuth._hashPassword(
        'password',
        '2ef27f4073c603ba8b7807c6de6d6a89'
      )

      expect(hash).toEqual(
        '0c2b24e20ee76a887eac1415cc2c175ff961e7a0f057cead74789c43399dd5ba'
      )
      expect(salt).toEqual('2ef27f4073c603ba8b7807c6de6d6a89')
    })

    it('hashes a password with a generated salt if none provided', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const [hash, salt] = dbAuth._hashPassword('password')

      expect(hash).toMatch(/^[a-f0-9]+$/)
      expect(hash.length).toEqual(64)
      expect(salt).toMatch(/^[a-f0-9]+$/)
      expect(salt.length).toEqual(32)
    })
  })

  describe('getAuthMethod', () => {
    it('gets methodName out of the query string', () => {
      event = {
        path: '/.redwood/functions/auth',
        queryStringParameters: { method: 'logout' },
        body: '',
        headers: {},
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getAuthMethod()).toEqual('logout')
    })

    it('gets methodName out of a JSON body', () => {
      event = {
        path: '/.redwood/functions/auth',
        queryStringParameters: {},
        body: '{"method":"signup"}',
        headers: {},
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getAuthMethod()).toEqual('signup')
    })

    it('otherwise returns undefined', () => {
      event = {
        path: '/.redwood/functions/auth',
        queryStringParameters: {},
        body: '',
        headers: {},
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getAuthMethod()).toBeUndefined()
    })
  })

  describe('validateField', () => {
    it('checks for the presence of a field', () => {
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(() => {
        dbAuth._validateField('username', null)
      }).toThrow(dbAuth.FieldRequiredError)
      expect(() => {
        dbAuth._validateField('username', '')
      }).toThrow(dbAuth.FieldRequiredError)
      expect(() => {
        dbAuth._validateField('username', ' ')
      }).toThrow(dbAuth.FieldRequiredError)
    })

    it('passes validation if everything is present', () => {
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._validateField('username', 'cannikin')).toEqual(true)
    })
  })

  describe('logoutResponse', () => {
    it('returns the response array necessary to log user out', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const [body, headers] = dbAuth._logoutResponse()

      expect(body).toEqual('')
      expect(headers['Set-Cookie']).toMatch(/^session=;/)
    })

    it('can accept an object to return in the body', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const [body, _headers] = dbAuth._logoutResponse({
        error: 'error message',
      })

      expect(body).toEqual('{"error":"error message"}')
    })
  })

  describe('ok', () => {
    it('returns a 200 response by default', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = dbAuth._ok('', {})

      expect(response.statusCode).toEqual(200)
    })

    it('can return other status codes', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = dbAuth._ok('', {}, { statusCode: 201 })

      expect(response.statusCode).toEqual(201)
    })

    it('stringifies a JSON body', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = dbAuth._ok({ foo: 'bar' }, {}, { statusCode: 201 })

      expect(response.body).toEqual('{"foo":"bar"}')
    })

    it('does not stringify a body that is a string already', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = dbAuth._ok('{"foo":"bar"}', {}, { statusCode: 201 })

      expect(response.body).toEqual('{"foo":"bar"}')
    })
  })

  describe('_notFound', () => {
    it('returns a 404 response', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = dbAuth._notFound()

      expect(response.statusCode).toEqual(404)
      expect(response.body).toEqual(undefined)
    })
  })

  describe('_badRequest', () => {
    it('returns a 400 response', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const response = dbAuth._badRequest('bad')

      expect(response.statusCode).toEqual(400)
      expect(response.body).toEqual('{"error":"bad"}')
    })
  })
})
