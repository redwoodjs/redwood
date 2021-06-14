import CryptoJS from 'crypto-js'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

import * as DbAuthError from './dbAuthErrors'

export class DbAuthHandler {
  // class constant: maps the auth functions to their required HTTP verb for access
  static get VERBS() {
    return {
      login: 'POST',
      logout: 'POST',
      signup: 'POST',
      getToken: 'GET',
    }
  }

  // class constant: all the attributes of the cookie other than the value itself
  static get COOKIE_META() {
    const meta = [`Path=/`, 'HttpOnly', 'SameSite=Strict', 'Secure']

    // set DBAUTH_COOKIE_DOMAIN if you need any subdomains to access this cookie
    if (process.env.DBAUTH_COOKIE_DOMAIN) {
      meta.push(`Domain=${process.env.DBAUTH_COOKIE_DOMAIN}`)
    }

    return meta
  }

  // default to epoch when we want to expire
  static get PAST_EXPIRES_DATE() {
    return new Date('1970-01-01T00:00:00.000+00:00').toUTCString()
  }

  // generate a new token (standard UUID)
  static get CSRF_TOKEN() {
    return uuidv4()
  }

  // convert to the UTC datetime string that's required for cookies
  get _futureExpiresDate() {
    let futureDate = new Date()
    futureDate.setSeconds(futureDate.getSeconds() + this.options.loginExpires)
    return futureDate.toUTCString()
  }

  // returns the Set-Cookie header to mark the cookie as expired ("deletes" the session)
  get _deleteSessionHeader() {
    return {
      'Set-Cookie': [
        'session=',
        ...this._cookieAttributes({ expires: 'now' }),
      ].join(';'),
    }
  }

  constructor(event, context, options = {}) {
    // must have a SESSION_SECRET so we can encrypt/decrypt the cookie
    if (!process.env.SESSION_SECRET) {
      throw new DbAuthError.NoSessionSecret()
    }

    try {
      this.event = event
      this.context = context
      this.options = options
      this.db = this.options.db
      this.dbAccessor = this.db[this.options.authModelAccessor]
      this.headerCsrfToken = this.event.headers['x-csrf-token']
      this.hasInvalidSession = false

      const [session, csrfToken] = this._decryptSession()
      this.session = session
      this.sessionCsrfToken = csrfToken
    } catch (e) {
      // if session can't be decrypted, keep track so we can log them out when
      // the auth method is called
      if (e instanceof DbAuthError.SessionDecryptionError) {
        this.hasInvalidSession = true
      } else {
        throw e
      }
    }
  }

  // Actual function that triggers everything else to happen:
  // `login`, `logout`, `signup`, or `getToken` is called from here, after some
  // checks to make sure the request is good
  async invoke() {
    // if there was a problem decryption the session, just return the logout
    // response immediately
    if (this.hasInvalidSession) {
      return this._ok(...this._logoutResponse())
    }

    try {
      // figure out which auth function is trying to be called
      const method = this._getAuthMethod()

      // return a 404 if the auth method doesn't exist or the request didn't
      // use the required HTTP verb
      if (
        !this[method] ||
        this.event.httpMethod !== DbAuthHandler.VERBS[method]
      ) {
        return this._notFound()
      }

      // call whatever auth method was requested and return the body and headers
      const [body, headers, options = { statusCode: 200 }] = await this[
        method
      ]()

      return this._ok(body, headers, options)
    } catch (e) {
      if (e instanceof DbAuthError.WrongVerbError) {
        return this._notFound()
      } else {
        return this._badRequest(e.message)
      }
    }
  }

  async login() {
    const { username, password } = JSON.parse(this.event.body)
    const user = await this._verifyUser(username, password)
    const sessionData = { id: user[this.options.authFields.id] }

    // this needs to go into graphql somewhere so that each request makes a new CSRF token
    // and sets it in both the encrypted session and the x-csrf-token header
    const csrfToken = DbAuthHandler.CSRF_TOKEN

    return [
      sessionData,
      {
        'X-CSRF-Token': csrfToken,
        ...this._createSessionHeader(sessionData, csrfToken),
      },
    ]
  }

  logout() {
    return this._logoutResponse()
  }

  async signup() {
    try {
      const user = await this._createUser()
      const sessionData = { id: user[this.options.authFields.id] }
      const csrfToken = DbAuthHandler.CSRF_TOKEN

      return [
        sessionData,
        {
          'X-CSRF-Token': csrfToken,
          ...this._createSessionHeader(sessionData, csrfToken),
        },
        { statusCode: 201 },
      ]
    } catch (e) {
      return this._logoutResponse(e.message)
    }
  }

  // converts the currentUser data to a JWT. returns `null` if session is not present
  async getToken() {
    try {
      const user = await this._getCurrentUser()
      const token = jwt.sign(JSON.stringify(user), process.env.SESSION_SECRET)

      return [token]
    } catch (e) {
      if (e instanceof DbAuthError.NotLoggedInError) {
        return this._logoutResponse()
      } else {
        return this._logoutResponse(e.message)
      }
    }
  }

  // returns all the cookie attributes in an array with the proper expiration date
  //
  // pass the argument `expires` set to "now" to get the attributes needed to expire
  // the session, any other string will (or even null) will return the attributes to
  // expire the session at the `FUTURE_EXPIRES_DATE`
  _cookieAttributes(options = {}) {
    const meta = JSON.parse(JSON.stringify(DbAuthHandler.COOKIE_META))
    const expiresAt =
      options.expires === 'now'
        ? DbAuthHandler.PAST_EXPIRES_DATE
        : this._futureExpiresDate
    meta.push(`Expires=${expiresAt}`)

    return meta
  }

  _encrypt(data) {
    return CryptoJS.AES.encrypt(data, process.env.SESSION_SECRET)
  }

  // returns the Set-Cookie header to be returned in the request (effectively creates the session)
  _createSessionHeader(data, csrfToken) {
    const session = JSON.stringify(data) + ';' + csrfToken
    const encrypted = this._encrypt(session)
    const cookie = [
      `session=${encrypted.toString()}`,
      ...this._cookieAttributes({ expires: 'future' }),
    ].join(';')

    return { 'Set-Cookie': cookie }
  }

  // checks the CSRF token in the header against the CSRF token in the session and
  // throw an error if they are not the same (not used yet)
  _validateCsrf() {
    if (this.sessionCsrfToken !== this.headerCsrfToken) {
      throw new DbAuthError.CsrfTokenMismatchError()
    }
    return true
  }

  // returns the actual value of the session cookie
  _getSession() {
    if (typeof this.event.headers.cookie === 'undefined') {
      return null
    }

    const cookies = this.event.headers.cookie.split(';')
    const sessionCookie = cookies.find((cook) => {
      return cook.split('=')[0].trim() === 'session'
    })

    if (!sessionCookie || sessionCookie === 'session=') {
      return null
    }

    return sessionCookie.split('=')[1].trim()
  }

  // decrypts the session cookie and returns an array: [data, csrf]
  _decryptSession() {
    const session = this._getSession()
    if (!session) {
      return []
    }

    try {
      const decoded = CryptoJS.AES.decrypt(
        session,
        process.env.SESSION_SECRET
      ).toString(CryptoJS.enc.Utf8)
      const [data, csrf] = decoded.split(';')
      const json = JSON.parse(data)

      return [json, csrf]
    } catch (e) {
      throw new DbAuthError.SessionDecryptionError()
    }
  }

  // verifies that a username and password are correct, and returns the user if so
  async _verifyUser(username, password) {
    // do we have all the query params we need to check the user?
    if (
      !username ||
      username.toString().trim() === '' ||
      !password ||
      password.toString().trim() === ''
    ) {
      throw new DbAuthError.UsernameAndPasswordRequiredError()
    }

    // does user exist?
    const user = await this.dbAccessor.findUnique({
      where: { [this.options.authFields.username]: username },
    })

    if (!user) {
      throw new DbAuthError.UserNotFoundError(username)
    }

    // is password correct?
    const [hashedPassword, _salt] = this._hashPassword(
      password,
      user[this.options.authFields.salt]
    )
    if (hashedPassword === user[this.options.authFields.hashedPassword]) {
      return user
    } else {
      throw new DbAuthError.IncorrectPasswordError()
    }
  }

  // removes sensative properties from a given user object
  _sanitizeUser(user) {
    const exclude = [
      this.options.authFields.hashedPassword,
      this.options.authFields.salt,
      ...this.options.excludeUserFields,
    ]

    const userArray = Object.entries(user)
    const filteredUser = userArray.filter(
      ([key, _value]) => !exclude.includes(key)
    )
    return Object.fromEntries(filteredUser)
  }

  // gets the user from the database and returns it as an object with
  // `excludeUserFields` fields stripped out
  async _getCurrentUser() {
    if (!this.session?.id) {
      throw new DbAuthError.NotLoggedInError()
    }

    const user = await this.dbAccessor.findUnique({
      where: { [this.options.authFields.id]: this.session?.id },
    })

    if (!user) {
      throw new DbAuthError.UserNotFoundError()
    }

    return this._sanitizeUser(user)
  }

  // creates and returns a user, first checking that the username/password
  // values pass validation
  async _createUser() {
    const { username, password, ...userAttributes } = JSON.parse(
      this.event.body
    )
    this._validateField('username', username)
    this._validateField('password', password)

    let user = await this.dbAccessor.findUnique({
      where: { [this.options.authFields.username]: username },
    })
    if (user) {
      throw new DbAuthError.DuplicateUsernameError(username)
    }

    // if we get here everything is good, call the app's signup handler and let
    // them worry about scrubbing data and saving to the DB
    const [hashedPassword, salt] = this._hashPassword(password)
    const newUser = await this.options.signupHandler({
      username,
      hashedPassword,
      salt,
      userAttributes,
    })

    return newUser
  }

  // hashes a password using either the given `salt` argument, or creates a new
  // salt and hashes using that. Either way, returns an array with [hash, salt]
  _hashPassword(text, salt) {
    const useSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString()

    return [
      CryptoJS.PBKDF2(text, useSalt, { keySize: 256 / 32 }).toString(),
      useSalt,
    ]
  }

  // figure out which auth method we're trying to call
  _getAuthMethod() {
    // first, try getting the method name out of the URL in the form of /.redwood/functions/auth/[methodName]
    let methodName = this.event.path.split('/').pop()

    if (methodName === 'auth' || !this[methodName]) {
      // next, try getting it from the query string instead, /.redwood/functions/auth?method=[methodName]
      methodName = this.event.queryStringParameters.method
    }

    if (methodName === 'auth' || !this[methodName]) {
      // finally, try getting it from the body in JSON: { method: [methodName] }
      try {
        methodName = JSON.parse(this.event.body).method
      } catch (e) {
        // there's no body, or it's not JSON, `handler` will return a 404
      }
    }

    return methodName
  }

  // checks that a single field meets validation requirements and
  // currently checks for presense only
  _validateField(name, value) {
    // check for presense
    if (!value || value.trim() === '') {
      throw new DbAuthError.FieldRequiredError(name)
    } else {
      return true
    }
  }

  _logoutResponse(message) {
    return [
      message ? JSON.stringify({ message }) : '',
      {
        ...this._deleteSessionHeader,
      },
    ]
  }

  _ok(body, headers = {}, options = { statusCode: 200 }) {
    return {
      statusCode: options.statusCode,
      body,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  }

  _notFound() {
    return {
      statusCode: 404,
    }
  }

  _badRequest(message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' },
    }
  }
}
