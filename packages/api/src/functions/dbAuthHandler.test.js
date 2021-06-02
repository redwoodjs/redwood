import jwt from 'jsonwebtoken'

import * as dbAuth from './dbAuthHandler'

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
global.db = new DbMock(['user'])

const UUID_REGEX = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/
const SET_SESSION_REGEX = /^session=[a-zA-Z0-9+=/]+;/
const JWT_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/

// helper to set global for cookie expiration and return that date
const setFutureDate = () => {
  global.options.loginExpires = 60 * 60
  let futureDate = new Date()
  futureDate.setSeconds(futureDate.getSeconds() + global.options.loginExpires)

  return futureDate
}

const createDbUser = async () => {
  return await global.db.user.create({
    data: {
      email: 'rob@redwoodjs.com',
      hashedPassword:
        '0c2b24e20ee76a887eac1415cc2c175ff961e7a0f057cead74789c43399dd5ba',
      salt: '2ef27f4073c603ba8b7807c6de6d6a89',
    },
  })
}

describe('dbAuth', () => {
  beforeEach(() => {
    global.event = {}
    global.context = {}

    global.sessionCsrfToken = undefined
    global.headerCsrfToken = undefined
    global.session = undefined
    global.options = {
      authModelAccessor: 'user',
      authFields: {
        id: 'id',
        username: 'email',
        hashedPassword: 'hashedPassword',
        salt: 'salt',
      },
      excludeUserFields: [],
      signupHandler: ({ username, hashedPassword, salt, userAttributes }) => {
        return global.db.user.create({
          data: {
            email: username,
            hashedPassword: hashedPassword,
            salt: salt,
            name: userAttributes.name,
          },
        })
      },
    }

    // encryption key so results are consistent regardless of settings in .env
    process.env.SESSION_SECRET = 'nREjs1HPS7cFia6tQHK70EWGtfhOgbqJQKsHQz3S'
    process.env.SELF_HOST = 'http://site.test'
  })

  afterEach(async () => {
    await global.db.user.deleteMany({
      where: { email: 'rob@redwoodjs.com' },
    })
  })

  describe('futureExpiresDate', () => {
    it('returns a date in the future as a UTCString', () => {
      global.options.loginExpires = 60 * 60
      const futureDate = setFutureDate()

      expect(dbAuth.futureExpiresDate()).toEqual(futureDate.toUTCString())
    })
  })

  describe('pastExpiresDate', () => {
    it('returns the start of epoch as a UTCString', () => {
      expect(dbAuth.pastExpiresDate()).toEqual(
        new Date(1970, 0, 1).toUTCString()
      )
    })
  })

  describe('dbAccessor', () => {
    it('returns the prisma db accessor for a model', () => {
      expect(dbAuth.dbAccessor()).toEqual(global.db.user)
    })
  })

  describe('createSessionHeader', () => {
    it('returns a Set-Cookie header', () => {
      const futureDate = setFutureDate()
      const headers = dbAuth.createSessionHeader({ foo: 'bar' }, 'abcd')

      expect(Object.keys(headers).length).toEqual(1)
      expect(Object.keys(headers)).toContain('Set-Cookie')
      expect(headers['Set-Cookie']).toMatch(
        `;Path=/;Domain=site.test;HttpOnly;SameSite=Strict;Secure;Expires=${futureDate.toUTCString()}`
      )
      // can't really match on the session value since it will change on every render,
      // but we can check that it contains a bunch of encryption-type characters
      expect(headers['Set-Cookie']).toMatch(SET_SESSION_REGEX)
      // and we can check that it's a certain number of characters
      expect(headers['Set-Cookie'].split(';')[0].length).toEqual(72)
    })
  })

  describe('deleteSessionHeader', () => {
    it('returns a Set-Cookie header to delete the session cookie', () => {
      const headers = dbAuth.deleteSessionHeader()

      expect(Object.keys(headers).length).toEqual(1)
      expect(Object.keys(headers)).toContain('Set-Cookie')
      expect(headers['Set-Cookie']).toEqual(
        `session=;Path=/;Domain=site.test;HttpOnly;SameSite=Strict;Secure;Expires=Thu, 01 Jan 1970 08:00:00 GMT`
      )
    })
  })

  describe('cookieAttributes', () => {
    it('returns an array of attributes for the session cookie', () => {
      const futureDate = setFutureDate()
      const attributes = dbAuth.cookieAttributes()

      expect(attributes.length).toEqual(6)
      expect(attributes[0]).toEqual('Path=/')
      expect(attributes[1]).toEqual('Domain=site.test')
      expect(attributes[2]).toEqual('HttpOnly')
      expect(attributes[3]).toEqual('SameSite=Strict')
      expect(attributes[4]).toEqual('Secure')
      expect(attributes[5]).toEqual(`Expires=${futureDate.toUTCString()}`)
    })
  })

  describe('generateCsrfToken', () => {
    it('returns a UUID', () => {
      expect(dbAuth.generateCsrfToken()).toMatch(UUID_REGEX)
    })
  })

  describe('validateCsrf', () => {
    it('returns true if session and header token match', () => {
      global.sessionCsrfToken = '00c39f8e-bf39-11eb-8529-0242ac130003'
      global.headerCsrfToken = '00c39f8e-bf39-11eb-8529-0242ac130003'

      expect(dbAuth.validateCsrf()).toEqual(true)
    })

    it('throws an error if session and header token do not match', () => {
      global.sessionCsrfToken = '07ad563c-bf39-11eb-8529-0242ac130003'
      global.headerCsrfToken = '0b70959a-bf39-11eb-8529-0242ac130003'

      expect(() => {
        dbAuth.validateCsrf()
      }).toThrow(dbAuth.CsrfTokenMismatchError)
    })
  })

  describe('getSession', () => {
    it('returns null if no cookies', () => {
      global.event = { headers: {} }

      expect(dbAuth.getSession()).toEqual(null)
    })

    it('returns null if no session cookie', () => {
      global.event = { headers: { cookie: 'foo=bar' } }

      expect(dbAuth.getSession()).toEqual(null)
    })

    it('returns the value of the session cookie', () => {
      global.event = { headers: { cookie: 'session=qwerty' } }

      expect(dbAuth.getSession()).toEqual('qwerty')
    })

    it('returns the value of the session cookie when there are multiple cookies', () => {
      global.event = { headers: { cookie: 'foo=bar;session=qwerty' } }
      expect(dbAuth.getSession()).toEqual('qwerty')

      global.event = { headers: { cookie: 'session=qwerty;foo=bar' } }
      expect(dbAuth.getSession()).toEqual('qwerty')
    })

    it('returns the value of the session cookie when there are multiple cookies separated by spaces (iOS Safari does this)', () => {
      global.event = { headers: { cookie: 'foo=bar; session=qwerty' } }
      expect(dbAuth.getSession()).toEqual('qwerty')

      global.event = { headers: { cookie: 'session=qwerty; foo=bar' } }
      expect(dbAuth.getSession()).toEqual('qwerty')
    })
  })

  describe('decryptSession', () => {
    it('returns an empty array if no session', () => {
      global.event = { headers: {} }

      expect(dbAuth.decryptSession()).toEqual([])
    })

    it('returns an empty array if session is empty', () => {
      global.event = { headers: { cookie: 'session=' } }

      expect(dbAuth.decryptSession()).toEqual([])
    })

    it('throws an error if decryption errors out', () => {
      global.event = { headers: { cookie: 'session=qwerty' } }

      expect(() => dbAuth.decryptSession()).toThrow(
        dbAuth.SessionDecryptionError
      )
    })

    it('returns an array with contents of the session and CSRF token', () => {
      setFutureDate()
      // to dynamically generate the header:
      // const sessionHeader = dbAuth.createSessionHeader({ foo: 'bar' }, 'abcd')
      global.event = {
        headers: {
          cookie:
            'session=U2FsdGVkX1/zRHVlEQhffsOufy7VLRAR6R4gb818vxblQQJFZI6W/T8uzxNUbQMx;Path=/;Domain=localhost;HttpOnly;SameSite=Strict;Secure;Expires=Fri, 28 May 2021 20:08:14 GMT',
        },
      }

      expect(dbAuth.decryptSession()).toEqual([{ foo: 'bar' }, 'abcd'])
    })
  })

  describe('verifyUser', () => {
    it('throws an error if username is missing', () => {
      dbAuth.verifyUser(null, 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuth.UsernameAndPasswordRequiredError)
      })
      dbAuth.verifyUser('', 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuth.UsernameAndPasswordRequiredError)
      })
      dbAuth.verifyUser(' ', 'password').catch((e) => {
        expect(e).toBeInstanceOf(dbAuth.UsernameAndPasswordRequiredError)
      })
    })

    it('throws an error if password is missing', () => {
      dbAuth.verifyUser('username').catch((e) => {
        expect(e).toBeInstanceOf(dbAuth.UsernameAndPasswordRequiredError)
      })
      dbAuth.verifyUser('username', null).catch((e) => {
        expect(e).toBeInstanceOf(dbAuth.UsernameAndPasswordRequiredError)
      })
      dbAuth.verifyUser('username', '').catch((e) => {
        expect(e).toBeInstanceOf(dbAuth.UsernameAndPasswordRequiredError)
      })
      dbAuth.verifyUser('username', ' ').catch((e) => {
        expect(e).toBeInstanceOf(dbAuth.UsernameAndPasswordRequiredError)
      })
    })

    it('throws an error if user is not found', async () => {
      try {
        await dbAuth.verifyUser('username', 'password')
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.UserNotFoundError)
      }
    })

    it('throws an error if password is incorrect', async () => {
      const dbUser = await createDbUser()

      try {
        await dbAuth.verifyUser(dbUser.email, 'incorrect')
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.IncorrectPasswordError)
      }
    })

    it('returns the user with matching username and password', async () => {
      const dbUser = await createDbUser()

      const user = await dbAuth.verifyUser(dbUser.email, 'password')

      expect(user.id).toEqual(dbUser.id)
    })
  })

  describe('getCurrentUser', () => {
    it('throw an error if user is not logged in', async () => {
      try {
        await dbAuth.getCurrentUser()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.NotLoggedInError)
      }
    })

    it('throw an error if user is not found', async () => {
      global.session = { id: 500 }

      try {
        await dbAuth.getCurrentUser()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.UserNotFoundError)
      }
    })

    it('returns the user whos id is in session', async () => {
      const dbUser = await createDbUser()
      global.session = { id: dbUser.id }

      const user = await dbAuth.getCurrentUser()

      expect(user.id).toEqual(dbUser.id)
    })

    it('strips some fields from returned user', async () => {
      const dbUser = await createDbUser()
      global.session = { id: dbUser.id }

      const user = await dbAuth.getCurrentUser()

      expect(user.hashedPassword).toEqual(undefined)
    })
  })

  describe('createUser', () => {
    it('throws an error if username is already taken', async () => {
      const dbUser = await createDbUser()
      global.event.body = JSON.stringify({
        username: dbUser.email,
        password: 'password',
      })

      try {
        await dbAuth.createUser()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.DuplicateUsernameError)
      }
    })

    it('throws an error if username is missing', async () => {
      global.event.body = JSON.stringify({
        password: 'password',
      })

      try {
        await dbAuth.createUser()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.FieldRequiredError)
      }
    })

    it('throws an error if password is missing', async () => {
      global.event.body = JSON.stringify({
        username: 'user@redwdoodjs.com',
      })

      try {
        await dbAuth.createUser()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.FieldRequiredError)
      }
    })

    it('creates a new user', async () => {
      global.event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
        name: 'Rob',
      })

      const user = await dbAuth.createUser()
      expect(user.email).toEqual('rob@redwoodjs.com')
      expect(user.hashedPassword).not.toBeNull()
      expect(user.salt).not.toBeNull()
      expect(user.name).toEqual('Rob')
    })
  })

  describe('hashPassword', () => {
    it('hashes a password with a given salt and returns both', () => {
      const [hash, salt] = dbAuth.hashPassword(
        'password',
        '2ef27f4073c603ba8b7807c6de6d6a89'
      )

      expect(hash).toEqual(
        '0c2b24e20ee76a887eac1415cc2c175ff961e7a0f057cead74789c43399dd5ba'
      )
      expect(salt).toEqual('2ef27f4073c603ba8b7807c6de6d6a89')
    })

    it('hashes a password with a generated salt if none provided', () => {
      const [hash, salt] = dbAuth.hashPassword('password')

      expect(hash).toMatch(/^[a-f0-9]+$/)
      expect(hash.length).toEqual(64)
      expect(salt).toMatch(/^[a-f0-9]+$/)
      expect(salt.length).toEqual(32)
    })
  })

  describe('getAuthMethod', () => {
    it('gets methodName out of the path', () => {
      global.event = {
        path: '/.redwood/functions/auth/login',
        queryStringParameters: {},
        body: '',
      }
      expect(dbAuth.getAuthMethod()).toEqual('login')
    })

    it('gets methodName out of the query string', () => {
      global.event = {
        path: '/.redwood/functions/auth',
        queryStringParameters: { method: 'login' },
        body: '',
      }
      expect(dbAuth.getAuthMethod()).toEqual('login')
    })

    it('gets methodName out of a JSON body', () => {
      global.event = {
        path: '/.redwood/functions/auth',
        queryStringParameters: {},
        body: '{"method":"login"}',
      }
      expect(dbAuth.getAuthMethod()).toEqual('login')
    })

    it('otherwise returns undefined', () => {
      global.event = {
        path: '/.redwood/functions/auth',
        queryStringParameters: {},
        body: '',
      }
      expect(dbAuth.getAuthMethod()).toBeUndefined()
    })
  })

  describe('validateField', () => {
    it('checks for the presence of a field', () => {
      expect(() => {
        dbAuth.validateField('username', null)
      }).toThrow(dbAuth.FieldRequiredError)
      expect(() => {
        dbAuth.validateField('username', '')
      }).toThrow(dbAuth.FieldRequiredError)
      expect(() => {
        dbAuth.validateField('username', ' ')
      }).toThrow(dbAuth.FieldRequiredError)
    })

    it('passes if no other validation', () => {
      expect(dbAuth.validateField('username', 'cannikin')).toEqual(true)
    })

    it('validates for format', () => {
      global.options.validation = {
        username: {
          format: {
            value: /^[a-z]+$/,
            message: 'Can only be lowercase letters',
          },
        },
      }
      try {
        dbAuth.validateField('username', 'Dude01')
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.FieldFormatError)
        expect(e.message).toEqual('Can only be lowercase letters')
      }
    })

    it('validates for minimum length', () => {
      global.options.validation = {
        username: {
          length: {
            min: {
              value: 4,
              message: 'too short',
            },
          },
        },
      }
      try {
        dbAuth.validateField('username', 'abc')
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.FieldFormatError)
        expect(e.message).toEqual('too short')
      }
    })

    it('validates for maximum length', () => {
      global.options.validation = {
        username: {
          length: {
            min: {
              value: 4,
              message: 'too long',
            },
          },
        },
      }
      try {
        dbAuth.validateField('username', 'qwerty')
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.FieldFormatError)
        expect(e.message).toEqual('too long')
      }
    })
  })

  describe('logoutResponse', () => {
    it('returns the response array necessary to log user out', () => {
      const [body, headers] = dbAuth.logoutResponse()

      expect(body).toEqual('')
      expect(headers['Set-Cookie']).toMatch(/^session=;/)
    })

    it('can accept a message to return in the body', () => {
      const [body, _headers] = dbAuth.logoutResponse('error message')

      expect(body).toEqual('{"message":"error message"}')
    })
  })

  describe('goodStatus', () => {
    it('returns a 2xx response', () => {
      const response = dbAuth.goodStatus(299, 'foobar', {
        'x-header': 'value',
      })

      expect(response.statusCode).toEqual(299)
      expect(response.body).toEqual('foobar')
      expect(response.headers['Content-Type']).toEqual('application/json')
      expect(response.headers['x-header']).toEqual('value')
    })
  })

  describe('ok', () => {
    it('returns a 200 response', () => {
      const response = dbAuth.ok('', {})

      expect(response.statusCode).toEqual(200)
    })
  })

  describe('created', () => {
    it('returns a 201 response', () => {
      const response = dbAuth.created('', {})

      expect(response.statusCode).toEqual(201)
    })
  })

  describe('notFound', () => {
    it('returns a 404 response', () => {
      const response = dbAuth.notFound()

      expect(response.statusCode).toEqual(404)
      expect(response.body).toEqual(undefined)
    })
  })

  describe('badRequest', () => {
    it('returns a 400 response', () => {
      const response = dbAuth.badRequest('bad')

      expect(response.statusCode).toEqual(400)
      expect(response.body).toEqual({ message: 'bad' })
    })
  })

  describe('setGlobalContext', () => {
    it('sets handler args into global', () => {
      dbAuth.setGlobalContext(
        { headers: {} },
        { foo: 'bar' },
        { db: global.db }
      )

      expect(global.event).toEqual({ headers: {} })
      expect(global.context).toEqual({ foo: 'bar' })
      expect(Object.keys(global.options)).toContain('db')
    })

    it('sets header-based CSRF token', () => {
      dbAuth.setGlobalContext(
        { headers: { 'x-csrf-token': 'qwerty' } },
        {},
        { db: global.db }
      )

      expect(global.headerCsrfToken).toEqual('qwerty')
    })

    it('sets session variables to nothing if session cannot be decrypted', () => {
      dbAuth.setGlobalContext(
        { headers: { 'x-csrf-token': 'qwerty' } },
        {},
        { db: global.db }
      )

      expect(global.session).toBeUndefined()
      expect(global.sessionCsrfToken).toBeUndefined()
    })

    it('sets session variables to valid session data', () => {
      dbAuth.setGlobalContext(
        {
          headers: {
            cookie:
              'session=U2FsdGVkX1/zRHVlEQhffsOufy7VLRAR6R4gb818vxblQQJFZI6W/T8uzxNUbQMx',
          },
        },
        { context: 'c' },
        { db: global.db }
      )

      expect(global.session).toEqual({ foo: 'bar' })
      expect(global.sessionCsrfToken).toEqual('abcd')
    })
  })

  describe('login', () => {
    it('throws an error if username is not found', async () => {
      await createDbUser()
      global.event.body = JSON.stringify({
        username: 'missing@redwoodjs.com',
        password: 'password',
      })

      try {
        await dbAuth.methods.login()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.UserNotFoundError)
      }
    })

    it('throws an error if password is wrong', async () => {
      await createDbUser()
      global.event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'incorrect',
      })

      try {
        await dbAuth.methods.login()
      } catch (e) {
        expect(e).toBeInstanceOf(dbAuth.IncorrectPasswordError)
      }
    })

    it('returns a JSON body of the user that is logged in', async () => {
      const user = await createDbUser()
      global.event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })

      const response = await dbAuth.methods.login()

      expect(response[0]).toEqual({ id: user.id })
    })

    it('returns a CSRF token in the header', async () => {
      await createDbUser()
      global.event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })

      const response = await dbAuth.methods.login()
      expect(response[1]['X-CSRF-Token']).toMatch(UUID_REGEX)
    })

    it('returns a set-cookie header to create session', async () => {
      await createDbUser()
      global.event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })

      const response = await dbAuth.methods.login()

      expect(response[1]['X-CSRF-Token']).toMatch(UUID_REGEX)
    })

    it('returns a CSRF token in the header', async () => {
      await createDbUser()
      global.event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
      })

      const response = await dbAuth.methods.login()

      expect(response[1]['Set-Cookie']).toMatch(SET_SESSION_REGEX)
    })
  })

  describe('logout', () => {
    it('returns set-cookie header for removing session', async () => {
      const response = await dbAuth.methods.logout()

      expect(response[1]['Set-Cookie']).toMatch(/^session=;/)
    })
  })

  describe('signup', () => {
    it('creates a new user', async () => {
      global.event.body = JSON.stringify({
        username: 'rob@redwoodjs.com',
        password: 'password',
        name: 'Rob',
      })
      const oldUserCount = await db.user.count()
      await dbAuth.methods.signup()
      const newUserCount = await db.user.count()

      expect(newUserCount).toEqual(oldUserCount + 1)
    })
  })

  describe('getToken', () => {
    it('returns a JWT for logged in user', async () => {
      const user = await createDbUser()
      global.session = { id: user.id }

      const response = await dbAuth.methods.getToken()

      expect(response[0]).toMatch(JWT_REGEX)
      expect(jwt.decode(response[0]).id).toEqual(user.id)
    })

    it('returns nothing if user is not logged in', async () => {
      const response = await dbAuth.methods.getToken()

      expect(response[0]).toEqual('')
    })

    it('returns any other error', async () => {
      global.session = { id: 9999999999 }

      const response = await dbAuth.methods.getToken()

      expect(response[0]).toEqual('{"message":"User not found"}')
    })
  })
})
