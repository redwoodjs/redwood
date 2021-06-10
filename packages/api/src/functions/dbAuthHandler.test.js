import CryptoJS from 'crypto-js'
import jwt from 'jsonwebtoken'

import * as dbAuthError from './dbAuthErrors'
import DbAuthHandler from './DbAuthHandler'

// encryption key so results are consistent regardless of settings in .env
process.env.SESSION_SECRET = 'nREjs1HPS7cFia6tQHK70EWGtfhOgbqJQKsHQz3S'
process.env.SELF_HOST = 'http://site.test'

// mock prisma db client
const DbMock = class {
  constructor(accessors) {
    accessors.forEach((accessor) => {
      this[accessor] = new TableMock(accessor)
    })
  }
}

// creates a mock table accessor
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
    return data
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
const JWT_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/
const UTC_DATE_REGEX = /\w{3}, \d{2} \w{3} \d{4} [\d:]{8} GMT/

// helper to set global for cookie expiration and return that date
// const setFutureDate = () => {
//   options.loginExpires = 60 * 60
//   let futureDate = new Date()
//   futureDate.setSeconds(futureDate.getSeconds() + options.loginExpires)

//   return futureDate
// }

const createDbUser = async () => {
  return await db.user.create({
    data: {
      email: 'rob@redwoodjs.com',
      hashedPassword:
        '0c2b24e20ee76a887eac1415cc2c175ff961e7a0f057cead74789c43399dd5ba',
      salt: '2ef27f4073c603ba8b7807c6de6d6a89',
    },
  })
}

const encryptToCookie = (data) => {
  return `session=${CryptoJS.AES.encrypt(data, process.env.SESSION_SECRET)}`
}

let event, context, options

describe('dbAuth', () => {
  beforeEach(() => {
    event = { headers: {} }
    context = {}

    options = {
      authModelAccessor: 'user',
      authFields: {
        id: 'id',
        username: 'email',
        hashedPassword: 'hashedPassword',
        salt: 'salt',
      },
      db: db,
      excludeUserFields: [],
      loginExpires: 60 * 60,
      signupHandler: ({ username, hashedPassword, salt, userAttributes }) => {
        return db.user.create({
          data: {
            email: username,
            hashedPassword: hashedPassword,
            salt: salt,
            name: userAttributes.name,
          },
        })
      },
    }
  })

  afterEach(async () => {
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
        new Date(1970, 0, 1).toUTCString()
      )
    })
  })

  describe('dbAccessor', () => {
    it('returns the prisma db accessor for a model', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      expect(dbAuth.dbAccessor).toEqual(db.user)
    })
  })

  describe('futureExpiresDate', () => {
    it('returns a date in the future as a UTCString', () => {
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth.futureExpiresDate).toMatch(UTC_DATE_REGEX)
    })
  })

  describe('deleteSessionHeader', () => {
    it('returns a Set-Cookie header to delete the session cookie', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const headers = dbAuth.deleteSessionHeader

      expect(Object.keys(headers).length).toEqual(1)
      expect(Object.keys(headers)).toContain('Set-Cookie')
      expect(headers['Set-Cookie']).toEqual(
        `session=;Path=/;Domain=site.test;HttpOnly;SameSite=Strict;Secure;Expires=Thu, 01 Jan 1970 08:00:00 GMT`
      )
    })
  })

  describe('_cookieAttributes', () => {
    it('returns an array of attributes for the session cookie', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const attributes = dbAuth._cookieAttributes({})

      expect(attributes.length).toEqual(6)
      expect(attributes[0]).toEqual('Path=/')
      expect(attributes[1]).toEqual('Domain=site.test')
      expect(attributes[2]).toEqual('HttpOnly')
      expect(attributes[3]).toEqual('SameSite=Strict')
      expect(attributes[4]).toEqual('Secure')
      expect(attributes[5]).toMatch(`Expires=`)
      expect(attributes[5]).toMatch(UTC_DATE_REGEX)
    })
  })

  describe('_createSessionHeader()', () => {
    it('returns a Set-Cookie header', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      const headers = dbAuth._createSessionHeader({ foo: 'bar' }, 'abcd')

      expect(Object.keys(headers).length).toEqual(1)
      expect(headers['Set-Cookie']).toMatch(
        `;Path=/;Domain=site.test;HttpOnly;SameSite=Strict;Secure;Expires=${dbAuth.futureExpiresDate}`
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
          'x-csrf-token': token,
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
          'x-csrf-token': 'invalid',
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(() => {
        dbAuth._validateCsrf()
      }).toThrow(dbAuthError.CsrfTokenMismatchError)
    })
  })

  describe('_getSession()', () => {
    it('returns null if no cookies', () => {
      const dbAuth = new DbAuthHandler(event, context, options)
      expect(dbAuth._getSession()).toEqual(null)
    })

    it('returns null if no session cookie', () => {
      event = { headers: { cookie: 'foo=bar' } }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getSession()).toEqual(null)
    })

    it('returns the value of the session cookie', () => {
      event = { headers: { cookie: 'session=qwerty' } }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getSession()).toEqual('qwerty')
    })

    it('returns the value of the session cookie when there are multiple cookies', () => {
      event = { headers: { cookie: 'foo=bar;session=qwerty' } }
      let dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getSession()).toEqual('qwerty')

      event = { headers: { cookie: 'session=qwerty;foo=bar' } }
      dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getSession()).toEqual('qwerty')
    })

    it('returns the value of the session cookie when there are multiple cookies separated by spaces (iOS Safari)', () => {
      event = { headers: { cookie: 'foo=bar; session=qwerty' } }
      let dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getSession()).toEqual('qwerty')

      event = { headers: { cookie: 'session=qwerty; foo=bar' } }
      dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._getSession()).toEqual('qwerty')
    })
  })

  describe('_decryptSession()', () => {
    it('returns an empty array if no session', () => {
      event = { headers: {} }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._decryptSession()).toEqual([])
    })

    it('returns an empty array if session is empty', () => {
      event = { headers: { cookie: 'session=' } }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._decryptSession()).toEqual([])
    })

    it('throws an error if decryption errors out', () => {
      event = { headers: { cookie: 'session=qwerty' } }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(() => dbAuth._decryptSession()).toThrow(
        dbAuth.SessionDecryptionError
      )
    })

    it('returns an array with contents of encrypted cookie parts', () => {
      const first = { foo: 'bar' }
      const second = 'abcd'
      event = {
        headers: {
          cookie: encryptToCookie(JSON.stringify(first) + ';' + second),
        },
      }
      const dbAuth = new DbAuthHandler(event, context, options)

      expect(dbAuth._decryptSession()).toEqual([first, second])
    })
  })

  describe('_verifyUser()', () => {
    it('throws an error if username is missing', () => {
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._verifyUser(null, 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      })
      dbAuth._verifyUser('', 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      })
      dbAuth._verifyUser(' ', 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UsernameAndPasswordRequiredError)
      })
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

    it('throws an error if user is not found', async () => {
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._verifyUser('username', 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.UserNotFoundError)
      })
      expect.assertions(1)
    })

    it('throws an error if password is incorrect', async () => {
      const dbUser = await createDbUser()
      const dbAuth = new DbAuthHandler(event, context, options)

      dbAuth._verifyUser(dbUser.email, 'incorrect').catch((e) => {
        expect(e).toBeInstanceOf(dbAuthError.IncorrectPasswordError)
      })

      expect.assertions(1)
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

    it('strips some fields from returned user', async () => {
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

      expect(dbUser.hashedPassword).not.toEqual(undefined)
      expect(user.hashedPassword).toEqual(undefined)
      expect(dbUser.salt).not.toEqual(undefined)
      expect(user.salt).toEqual(undefined)
    })
  })

  //   describe('createUser', () => {
  //     it('throws an error if username is already taken', async () => {
  //       const dbUser = await createDbUser()
  //       global.event.body = JSON.stringify({
  //         username: dbUser.email,
  //         password: 'password',
  //       })

  //       dbAuth.createUser().catch((e) => {
  //         expect(e).toBeInstanceOf(dbAuth.DuplicateUsernameError)
  //       })
  //       expect.assertions(1)
  //     })

  //     it('throws an error if username is missing', async () => {
  //       global.event.body = JSON.stringify({
  //         password: 'password',
  //       })

  //       dbAuth.createUser().catch((e) => {
  //         expect(e).toBeInstanceOf(dbAuth.FieldRequiredError)
  //       })
  //       expect.assertions(1)
  //     })

  //     it('throws an error if password is missing', async () => {
  //       global.event.body = JSON.stringify({
  //         username: 'user@redwdoodjs.com',
  //       })

  //       dbAuth.createUser().catch((e) => {
  //         expect(e).toBeInstanceOf(dbAuth.FieldRequiredError)
  //       })
  //       expect.assertions(1)
  //     })

  //     it('creates a new user', async () => {
  //       global.event.body = JSON.stringify({
  //         username: 'rob@redwoodjs.com',
  //         password: 'password',
  //         name: 'Rob',
  //       })

  //       const user = await dbAuth.createUser()
  //       expect(user.email).toEqual('rob@redwoodjs.com')
  //       expect(user.hashedPassword).not.toBeNull()
  //       expect(user.salt).not.toBeNull()
  //       expect(user.name).toEqual('Rob')
  //     })
  //   })

  //   describe('hashPassword', () => {
  //     it('hashes a password with a given salt and returns both', () => {
  //       const [hash, salt] = dbAuth.hashPassword(
  //         'password',
  //         '2ef27f4073c603ba8b7807c6de6d6a89'
  //       )

  //       expect(hash).toEqual(
  //         '0c2b24e20ee76a887eac1415cc2c175ff961e7a0f057cead74789c43399dd5ba'
  //       )
  //       expect(salt).toEqual('2ef27f4073c603ba8b7807c6de6d6a89')
  //     })

  //     it('hashes a password with a generated salt if none provided', () => {
  //       const [hash, salt] = dbAuth.hashPassword('password')

  //       expect(hash).toMatch(/^[a-f0-9]+$/)
  //       expect(hash.length).toEqual(64)
  //       expect(salt).toMatch(/^[a-f0-9]+$/)
  //       expect(salt.length).toEqual(32)
  //     })
  //   })

  //   describe('getAuthMethod', () => {
  //     it('gets methodName out of the path', () => {
  //       global.event = {
  //         path: '/.redwood/functions/auth/login',
  //         queryStringParameters: {},
  //         body: '',
  //       }
  //       expect(dbAuth.getAuthMethod()).toEqual('login')
  //     })

  //     it('gets methodName out of the query string', () => {
  //       global.event = {
  //         path: '/.redwood/functions/auth',
  //         queryStringParameters: { method: 'login' },
  //         body: '',
  //       }
  //       expect(dbAuth.getAuthMethod()).toEqual('login')
  //     })

  //     it('gets methodName out of a JSON body', () => {
  //       global.event = {
  //         path: '/.redwood/functions/auth',
  //         queryStringParameters: {},
  //         body: '{"method":"login"}',
  //       }
  //       expect(dbAuth.getAuthMethod()).toEqual('login')
  //     })

  //     it('otherwise returns undefined', () => {
  //       global.event = {
  //         path: '/.redwood/functions/auth',
  //         queryStringParameters: {},
  //         body: '',
  //       }
  //       expect(dbAuth.getAuthMethod()).toBeUndefined()
  //     })
  //   })

  //   describe('validateField', () => {
  //     it('checks for the presence of a field', () => {
  //       expect(() => {
  //         dbAuth.validateField('username', null)
  //       }).toThrow(dbAuth.FieldRequiredError)
  //       expect(() => {
  //         dbAuth.validateField('username', '')
  //       }).toThrow(dbAuth.FieldRequiredError)
  //       expect(() => {
  //         dbAuth.validateField('username', ' ')
  //       }).toThrow(dbAuth.FieldRequiredError)
  //     })

  //     it('passes validation if everything is present', () => {
  //       expect(dbAuth.validateField('username', 'cannikin')).toEqual(true)
  //     })
  //   })

  //   describe('logoutResponse', () => {
  //     it('returns the response array necessary to log user out', () => {
  //       const [body, headers] = dbAuth.logoutResponse()

  //       expect(body).toEqual('')
  //       expect(headers['Set-Cookie']).toMatch(/^session=;/)
  //     })

  //     it('can accept a message to return in the body', () => {
  //       const [body, _headers] = dbAuth.logoutResponse('error message')

  //       expect(body).toEqual('{"message":"error message"}')
  //     })
  //   })

  //   describe('goodStatus', () => {
  //     it('returns a 2xx response', () => {
  //       const response = dbAuth.goodStatus(299, 'foobar', {
  //         'x-header': 'value',
  //       })

  //       expect(response.statusCode).toEqual(299)
  //       expect(response.body).toEqual('foobar')
  //       expect(response.headers['Content-Type']).toEqual('application/json')
  //       expect(response.headers['x-header']).toEqual('value')
  //     })
  //   })

  //   describe('ok', () => {
  //     it('returns a 200 response', () => {
  //       const response = dbAuth.ok('', {})

  //       expect(response.statusCode).toEqual(200)
  //     })
  //   })

  //   describe('created', () => {
  //     it('returns a 201 response', () => {
  //       const response = dbAuth.created('', {})

  //       expect(response.statusCode).toEqual(201)
  //     })
  //   })

  //   describe('notFound', () => {
  //     it('returns a 404 response', () => {
  //       const response = dbAuth.notFound()

  //       expect(response.statusCode).toEqual(404)
  //       expect(response.body).toEqual(undefined)
  //     })
  //   })

  //   describe('badRequest', () => {
  //     it('returns a 400 response', () => {
  //       const response = dbAuth.badRequest('bad')

  //       expect(response.statusCode).toEqual(400)
  //       expect(response.body).toEqual({ message: 'bad' })
  //     })
  //   })

  //   describe('setGlobalContext', () => {
  //     it('sets handler args into global', () => {
  //       dbAuth.setGlobalContext(
  //         { headers: {} },
  //         { foo: 'bar' },
  //         { db: global.db }
  //       )

  //       expect(global.event).toEqual({ headers: {} })
  //       expect(global.context).toEqual({ foo: 'bar' })
  //       expect(Object.keys(global.options)).toContain('db')
  //     })

  //     it('sets header-based CSRF token', () => {
  //       dbAuth.setGlobalContext(
  //         { headers: { 'x-csrf-token': 'qwerty' } },
  //         {},
  //         { db: global.db }
  //       )

  //       expect(global.headerCsrfToken).toEqual('qwerty')
  //     })

  //     it('sets session variables to nothing if session cannot be decrypted', () => {
  //       dbAuth.setGlobalContext(
  //         { headers: { 'x-csrf-token': 'qwerty' } },
  //         {},
  //         { db: global.db }
  //       )

  //       expect(global.session).toBeUndefined()
  //       expect(global.sessionCsrfToken).toBeUndefined()
  //     })

  //     it('sets session variables to valid session data', () => {
  //       dbAuth.setGlobalContext(
  //         {
  //           headers: {
  //             cookie:
  //               'session=U2FsdGVkX1/zRHVlEQhffsOufy7VLRAR6R4gb818vxblQQJFZI6W/T8uzxNUbQMx',
  //           },
  //         },
  //         { context: 'c' },
  //         { db: global.db }
  //       )

  //       expect(global.session).toEqual({ foo: 'bar' })
  //       expect(global.sessionCsrfToken).toEqual('abcd')
  //     })
  //   })

  //   describe('login', () => {
  //     it('throws an error if username is not found', async () => {
  //       await createDbUser()
  //       global.event.body = JSON.stringify({
  //         username: 'missing@redwoodjs.com',
  //         password: 'password',
  //       })

  //       dbAuth.methods.login().catch((e) => {
  //         expect(e).toBeInstanceOf(dbAuth.UserNotFoundError)
  //       })
  //       expect.assertions(1)
  //     })

  //     it('throws an error if password is wrong', async () => {
  //       await createDbUser()
  //       global.event.body = JSON.stringify({
  //         username: 'rob@redwoodjs.com',
  //         password: 'incorrect',
  //       })

  //       dbAuth.methods.login().catch((e) => {
  //         expect(e).toBeInstanceOf(dbAuth.IncorrectPasswordError)
  //       })
  //       expect.assertions(1)
  //     })

  //     it('returns a JSON body of the user that is logged in', async () => {
  //       const user = await createDbUser()
  //       global.event.body = JSON.stringify({
  //         username: 'rob@redwoodjs.com',
  //         password: 'password',
  //       })

  //       const response = await dbAuth.methods.login()

  //       expect(response[0]).toEqual({ id: user.id })
  //     })

  //     it('returns a CSRF token in the header', async () => {
  //       await createDbUser()
  //       global.event.body = JSON.stringify({
  //         username: 'rob@redwoodjs.com',
  //         password: 'password',
  //       })

  //       const response = await dbAuth.methods.login()
  //       expect(response[1]['X-CSRF-Token']).toMatch(UUID_REGEX)
  //     })

  //     it('returns a set-cookie header to create session', async () => {
  //       await createDbUser()
  //       global.event.body = JSON.stringify({
  //         username: 'rob@redwoodjs.com',
  //         password: 'password',
  //       })

  //       const response = await dbAuth.methods.login()

  //       expect(response[1]['X-CSRF-Token']).toMatch(UUID_REGEX)
  //     })

  //     it('returns a CSRF token in the header', async () => {
  //       await createDbUser()
  //       global.event.body = JSON.stringify({
  //         username: 'rob@redwoodjs.com',
  //         password: 'password',
  //       })

  //       const response = await dbAuth.methods.login()

  //       expect(response[1]['Set-Cookie']).toMatch(SET_SESSION_REGEX)
  //     })
  //   })

  //   describe('logout', () => {
  //     it('returns set-cookie header for removing session', async () => {
  //       const response = await dbAuth.methods.logout()

  //       expect(response[1]['Set-Cookie']).toMatch(/^session=;/)
  //     })
  //   })

  //   describe('signup', () => {
  //     it('creates a new user', async () => {
  //       global.event.body = JSON.stringify({
  //         username: 'rob@redwoodjs.com',
  //         password: 'password',
  //         name: 'Rob',
  //       })
  //       const oldUserCount = await db.user.count()
  //       await dbAuth.methods.signup()
  //       const newUserCount = await db.user.count()

  //       expect(newUserCount).toEqual(oldUserCount + 1)
  //     })
  //   })

  //   describe('getToken', () => {
  //     it('returns a JWT for logged in user', async () => {
  //       const user = await createDbUser()
  //       global.session = { id: user.id }

  //       const response = await dbAuth.methods.getToken()

  //       expect(response[0]).toMatch(JWT_REGEX)
  //       expect(jwt.decode(response[0]).id).toEqual(user.id)
  //     })

  //     it('returns nothing if user is not logged in', async () => {
  //       const response = await dbAuth.methods.getToken()

  //       expect(response[0]).toEqual('')
  //     })

  //     it('returns any other error', async () => {
  //       global.session = { id: 9999999999 }

  //       const response = await dbAuth.methods.getToken()

  //       expect(response[0]).toEqual('{"message":"User not found"}')
  //     })
  //   })
})
