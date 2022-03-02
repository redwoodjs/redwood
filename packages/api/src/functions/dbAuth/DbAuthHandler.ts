import type { PrismaClient } from '@prisma/client'
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import CryptoJS from 'crypto-js'
import md5 from 'md5'
import { v4 as uuidv4 } from 'uuid'

import { CorsConfig, CorsContext, createCorsContext } from '../../cors'
import { normalizeRequest } from '../../transforms'

import * as DbAuthError from './errors'
import { decryptSession, getSession } from './shared'

interface DbAuthHandlerOptions {
  /**
   * Provide prisma db client
   */
  db: PrismaClient
  /**
   * The name of the property you'd call on `db` to access your user table.
   * ie. if your Prisma model is named `User` this value would be `user`, as in `db.user`
   */
  authModelAccessor: keyof PrismaClient
  /**
   *  A map of what dbAuth calls a field to what your database calls it.
   * `id` is whatever column you use to uniquely identify a user (probably
   * something like `id` or `userId` or even `email`)
   */
  authFields: {
    id: string
    username: string
    hashedPassword: string
    salt: string
    resetToken: string
    resetTokenExpiresAt: string
  }
  /**
   * Object containing cookie config options
   */
  cookie?: {
    Path: string
    HttpOnly: boolean
    Secure: boolean
    SameSite: string
    Domain: string
  }
  /**
   * Object containing forgot password options
   */
  forgotPassword: {
    handler: (user: Record<string, unknown>) => Promise<any>
    errors?: {
      usernameNotFound?: string
      usernameRequired?: string
    }
    expires: number
  }
  /**
   * Object containing login options
   */
  login: {
    /**
     * Anything you want to happen before logging the user in. This can include
     * throwing an error to prevent login. If you do want to allow login, this
     * function must return an object representing the user you want to be logged
     * in, containing at least an `id` field (whatever named field was provided
     * for `authFields.id`). For example: `return { id: user.id }`
     */
    handler: (user: Record<string, unknown>) => Promise<any>
    /**
     * Object containing error strings
     */
    errors?: {
      usernameOrPasswordMissing?: string
      usernameNotFound?: string
      incorrectPassword?: string
    }
    /**
     * How long a user will remain logged in, in seconds
     */
    expires: number
  }
  /**
   * Object containing reset password options
   */
  resetPassword: {
    handler: (user: Record<string, unknown>) => Promise<any>
    allowReusedPassword: boolean
    errors?: {
      resetTokenExpired?: string
      resetTokenInvalid?: string
      resetTokenRequired?: string
      reusedPassword?: string
    }
  }
  /**
   * Object containing login options
   */
  signup: {
    /**
     * Whatever you want to happen to your data on new user signup. Redwood will
     * check for duplicate usernames before calling this handler. At a minimum
     * you need to save the `username`, `hashedPassword` and `salt` to your
     * user table. `userAttributes` contains any additional object members that
     * were included in the object given to the `signUp()` function you got
     * from `useAuth()`
     */
    handler: (signupHandlerOptions: SignupHandlerOptions) => Promise<any>
    /**
     * Object containing error strings
     */
    errors?: {
      fieldMissing?: string
      usernameTaken?: string
    }
  }

  /**
   * CORS settings, same as in createGraphqlHandler
   */
  cors?: CorsConfig
}

interface SignupHandlerOptions {
  username: string
  hashedPassword: string
  salt: string
  userAttributes?: any
}

interface SessionRecord {
  id: string | number
}

type AuthMethodNames =
  | 'forgotPassword'
  | 'getToken'
  | 'login'
  | 'logout'
  | 'resetPassword'
  | 'signup'
  | 'validateResetToken'

type Params = {
  username?: string
  password?: string
  method: AuthMethodNames
  [key: string]: unknown
}

export class DbAuthHandler {
  event: APIGatewayProxyEvent
  context: LambdaContext
  options: DbAuthHandlerOptions
  params: Params
  db: PrismaClient
  dbAccessor: any
  headerCsrfToken: string | undefined
  hasInvalidSession: boolean
  session: SessionRecord | undefined
  sessionCsrfToken: string | undefined
  corsContext: CorsContext | undefined

  // class constant: list of auth methods that are supported
  static get METHODS(): AuthMethodNames[] {
    return [
      'forgotPassword',
      'getToken',
      'login',
      'logout',
      'resetPassword',
      'signup',
      'validateResetToken',
    ]
  }

  // class constant: maps the auth functions to their required HTTP verb for access
  static get VERBS() {
    return {
      forgotPassword: 'POST',
      getToken: 'GET',
      login: 'POST',
      logout: 'POST',
      resetPassword: 'POST',
      signup: 'POST',
      validateResetToken: 'POST',
    }
  }

  // class constant: all the attributes of the cookie other than the value itself
  // DEPRECATED: Remove once deprecation warning is removed from _cookieAttributes()
  static get COOKIE_META() {
    const meta = [`Path=/`, 'HttpOnly', 'SameSite=Strict']

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
    const futureDate = new Date()
    futureDate.setSeconds(futureDate.getSeconds() + this.options.login.expires)
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

  constructor(
    event: APIGatewayProxyEvent,
    context: LambdaContext,
    options: DbAuthHandlerOptions
  ) {
    this.event = event
    this.context = context
    this.options = options

    this._validateOptions()

    this.params = this._parseBody()
    this.db = this.options.db
    this.dbAccessor = this.db[this.options.authModelAccessor]
    this.headerCsrfToken = this.event.headers['csrf-token']
    this.hasInvalidSession = false

    if (options.cors) {
      this.corsContext = createCorsContext(options.cors)
    }

    try {
      const [session, csrfToken] = decryptSession(
        getSession(this.event.headers['cookie'])
      )
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

  // Actual function that triggers everything else to happen: `login`, `signup`,
  // etc. is called from here, after some checks to make sure the request is good
  async invoke() {
    const request = normalizeRequest(this.event)
    let corsHeaders = {}
    if (this.corsContext) {
      corsHeaders = this.corsContext.getRequestHeaders(request)
      // Return CORS headers for OPTIONS requests
      if (this.corsContext.shouldHandleCors(request)) {
        return {
          body: '',
          statusCode: 200,
          headers: corsHeaders,
        }
      }
    }

    // if there was a problem decryption the session, just return the logout
    // response immediately
    if (this.hasInvalidSession) {
      return this._ok(...this._logoutResponse())
    }

    let response: {
      statusCode: number
      headers?: Record<string, string>
    }

    try {
      const method = this._getAuthMethod()

      // get the auth method the incoming request is trying to call
      if (!DbAuthHandler.METHODS.includes(method)) {
        response = this._notFound()
      }

      // make sure it's using the correct verb, GET vs POST
      if (this.event.httpMethod !== DbAuthHandler.VERBS[method]) {
        response = this._notFound()
      }

      // call whatever auth method was requested and return the body and headers
      const [body, headers, options = { statusCode: 200 }] = await this[
        method
      ]()

      response = this._ok(body, headers, options)
    } catch (e: any) {
      if (e instanceof DbAuthError.WrongVerbError) {
        response = this._notFound()
      } else {
        response = this._badRequest(e.message || e)
      }
    }

    return {
      ...response,
      headers: {
        ...(response.headers || {}),
        ...corsHeaders,
      },
    }
  }

  async forgotPassword() {
    const { username } = this.params

    // was the username sent in at all?
    if (!username || username.trim() === '') {
      throw new DbAuthError.UsernameRequiredError(
        this.options.forgotPassword?.errors?.usernameRequired ||
          `Username is required`
      )
    }

    let user = await this.dbAccessor.findUnique({
      where: { [this.options.authFields.username]: username },
    })

    if (user) {
      const tokenExpires = new Date()
      tokenExpires.setSeconds(
        tokenExpires.getSeconds() + this.options.forgotPassword.expires
      )

      // generate a token
      let token = md5(uuidv4())
      const buffer = new Buffer(token)
      token = buffer.toString('base64').replace('=', '').substring(0, 16)

      // set token and expires time
      user = await this.dbAccessor.update({
        where: {
          [this.options.authFields.id]: user[this.options.authFields.id],
        },
        data: {
          [this.options.authFields.resetToken]: token,
          [this.options.authFields.resetTokenExpiresAt]: tokenExpires,
        },
      })

      // call user-defined handler in their functions/auth.js
      const response = await this.options.forgotPassword.handler(
        this._sanitizeUser(user)
      )

      return [
        response ? JSON.stringify(response) : '',
        {
          ...this._deleteSessionHeader,
        },
      ]
    } else {
      throw new DbAuthError.UsernameNotFoundError(
        this.options.forgotPassword?.errors?.usernameNotFound ||
          `Username '${username} not found`
      )
    }
  }

  async getToken() {
    try {
      const user = await this._getCurrentUser()

      // need to return *something* for our existing Authorization header stuff
      // to work, so return the user's ID in case we can use it for something
      // in the future
      return [user.id]
    } catch (e: any) {
      if (e instanceof DbAuthError.NotLoggedInError) {
        return this._logoutResponse()
      } else {
        return this._logoutResponse({ error: e.message })
      }
    }
  }

  async login() {
    const { username, password } = this.params
    const dbUser = await this._verifyUser(username, password)
    const handlerUser = await this.options.login.handler(dbUser)

    if (
      handlerUser == null ||
      handlerUser[this.options.authFields.id] == null
    ) {
      throw new DbAuthError.NoUserIdError()
    }

    return this._loginResponse(handlerUser)
  }

  logout() {
    return this._logoutResponse()
  }

  async resetPassword() {
    const { password, resetToken } = this.params

    // is the resetToken present?
    if (resetToken == null || String(resetToken).trim() === '') {
      throw new DbAuthError.ResetTokenRequiredError(
        this.options.resetPassword?.errors?.resetTokenRequired
      )
    }

    // is password present?
    if (password == null || String(password).trim() === '') {
      throw new DbAuthError.PasswordRequiredError()
    }

    let user = await this._findUserByToken(resetToken as string)
    const [hashedPassword] = this._hashPassword(password, user.salt)

    if (
      !this.options.resetPassword.allowReusedPassword &&
      user.hashedPassword === hashedPassword
    ) {
      throw new DbAuthError.ReusedPasswordError(
        this.options.resetPassword?.errors?.reusedPassword
      )
    }

    // if we got here then we can update the password in the database
    user = await this.dbAccessor.update({
      where: { [this.options.authFields.id]: user[this.options.authFields.id] },
      data: {
        [this.options.authFields.hashedPassword]: hashedPassword,
        [this.options.authFields.resetToken]: null,
        [this.options.authFields.resetTokenExpiresAt]: null,
      },
    })

    // call the user-defined handler so they can decide what to do with this user
    const response = await this.options.resetPassword.handler(
      this._sanitizeUser(user)
    )

    // returning the user from the handler means to log them in automatically
    if (response) {
      return this._loginResponse(user)
    } else {
      return this._logoutResponse({})
    }
  }

  async signup() {
    const userOrMessage = await this._createUser()

    // at this point `user` is either an actual user, in which case log the
    // user in automatically, or it's a string, which is a message to show
    // the user (something like "please verify your email")
    if (typeof userOrMessage === 'object') {
      const user = userOrMessage
      return this._loginResponse(user, 201)
    } else {
      const message = userOrMessage
      return [JSON.stringify({ message }), {}, { statusCode: 201 }]
    }
  }

  async validateResetToken() {
    // is token present at all?
    if (
      this.params.resetToken == null ||
      String(this.params.resetToken).trim() === ''
    ) {
      throw new DbAuthError.ResetTokenRequiredError(
        this.options.resetPassword?.errors?.resetTokenRequired
      )
    }

    const user = await this._findUserByToken(this.params.resetToken as string)

    return [
      JSON.stringify(this._sanitizeUser(user)),
      {
        ...this._deleteSessionHeader,
      },
    ]
  }

  // validates that we have all the ENV and options we need to login/signup
  _validateOptions() {
    // must have a SESSION_SECRET so we can encrypt/decrypt the cookie
    if (!process.env.SESSION_SECRET) {
      throw new DbAuthError.NoSessionSecretError()
    }

    // must have an expiration time set for the session cookie
    if (!this.options?.login?.expires) {
      throw new DbAuthError.NoSessionExpirationError()
    }

    // must have a login handler to actually log a user in
    if (!this.options?.login?.handler) {
      throw new DbAuthError.NoLoginHandlerError()
    }

    // must have a signup handler to define how to create a new user
    if (!this.options?.signup?.handler) {
      throw new DbAuthError.NoSignupHandlerError()
    }

    // must have a forgot password handler to define how to notify user of reset token
    if (!this.options?.forgotPassword?.handler) {
      throw new DbAuthError.NoForgotPasswordHandlerError()
    }

    // must have a reset password handler to define what to do with user once password changed
    if (!this.options?.resetPassword?.handler) {
      throw new DbAuthError.NoResetPasswordHandlerError()
    }
  }

  // removes sensative fields from user before sending over the wire
  _sanitizeUser(user: Record<string, unknown>) {
    const sanitized = JSON.parse(JSON.stringify(user))
    delete sanitized[this.options.authFields.hashedPassword]
    delete sanitized[this.options.authFields.salt]

    return sanitized
  }

  // parses the event body into JSON, whether it's base64 encoded or not
  _parseBody() {
    if (this.event.body) {
      if (this.event.isBase64Encoded) {
        return JSON.parse(
          Buffer.from(this.event.body || '', 'base64').toString('utf-8')
        )
      } else {
        return JSON.parse(this.event.body)
      }
    } else {
      return {}
    }
  }

  // returns all the cookie attributes in an array with the proper expiration date
  //
  // pass the argument `expires` set to "now" to get the attributes needed to expire
  // the session, or "future" (or left out completely) to set to `_futureExpiresDate`
  _cookieAttributes({ expires = 'future' }: { expires?: 'now' | 'future' }) {
    let meta

    // DEPRECATED: Remove deprecation logic after a few releases, assume this.options.cookie contains config
    // TODO: Once old behavior is removed, throw an error if there is no cookie config present
    if (!this.options.cookie) {
      console.warn(
        `\n[Deprecation Notice] dbAuth cookie config has moved to\n  api/src/function/auth.js for better customization.\n  See https://redwoodjs.com/docs/authentication#cookie-config\n`
      )
      meta = JSON.parse(JSON.stringify(DbAuthHandler.COOKIE_META))

      if (process.env.NODE_ENV !== 'development') {
        meta.push('Secure')
      }
    } else {
      meta = Object.keys(this.options.cookie)
        .map((key) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore-next-line
          if (this.options.cookie[key] === true) {
            return key
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line
          } else if (this.options.cookie[key] === false) {
            return null
          } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line
            return `${key}=${this.options.cookie[key]}`
          }
        })
        .filter((v) => v)
    }

    const expiresAt =
      expires === 'now'
        ? DbAuthHandler.PAST_EXPIRES_DATE
        : this._futureExpiresDate
    meta.push(`Expires=${expiresAt}`)

    return meta
  }

  _encrypt(data: string) {
    return CryptoJS.AES.encrypt(data, process.env.SESSION_SECRET as string)
  }

  // returns the Set-Cookie header to be returned in the request (effectively creates the session)
  _createSessionHeader(
    data: SessionRecord,
    csrfToken: string
  ): Record<'Set-Cookie', string> {
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

  async _findUserByToken(token: string) {
    const tokenExpires = new Date()
    tokenExpires.setSeconds(
      tokenExpires.getSeconds() - this.options.forgotPassword.expires
    )

    const user = await this.dbAccessor.findFirst({
      where: {
        [this.options.authFields.resetToken]: token,
      },
    })

    // user not found with the given token
    if (!user) {
      throw new DbAuthError.ResetTokenInvalidError(
        this.options.resetPassword?.errors?.resetTokenInvalid
      )
    }

    // token has expired
    if (user[this.options.authFields.resetTokenExpiresAt] < tokenExpires) {
      await this._clearResetToken(user)
      throw new DbAuthError.ResetTokenExpiredError(
        this.options.resetPassword?.errors?.resetTokenExpired
      )
    }

    return user
  }

  async _clearResetToken(user: Record<string, unknown>) {
    await this.dbAccessor.update({
      where: { [this.options.authFields.id]: user[this.options.authFields.id] },
      data: {
        [this.options.authFields.resetToken]: null,
        [this.options.authFields.resetTokenExpiresAt]: null,
      },
    })
  }

  // verifies that a username and password are correct, and returns the user if so
  async _verifyUser(
    username: string | undefined,
    password: string | undefined
  ) {
    // do we have all the query params we need to check the user?
    if (
      !username ||
      username.toString().trim() === '' ||
      !password ||
      password.toString().trim() === ''
    ) {
      throw new DbAuthError.UsernameAndPasswordRequiredError(
        this.options.login?.errors?.usernameOrPasswordMissing
      )
    }

    // does user exist?
    const user = await this.dbAccessor.findUnique({
      where: { [this.options.authFields.username]: username },
    })

    if (!user) {
      throw new DbAuthError.UserNotFoundError(
        username,
        this.options.login?.errors?.usernameNotFound
      )
    }

    // is password correct?
    const [hashedPassword, _salt] = this._hashPassword(
      password,
      user[this.options.authFields.salt]
    )
    if (hashedPassword === user[this.options.authFields.hashedPassword]) {
      return user
    } else {
      throw new DbAuthError.IncorrectPasswordError(
        username,
        this.options.login?.errors?.incorrectPassword
      )
    }
  }

  // gets the user from the database and returns only its ID
  async _getCurrentUser() {
    if (!this.session?.id) {
      throw new DbAuthError.NotLoggedInError()
    }

    const user = await this.dbAccessor.findUnique({
      where: { [this.options.authFields.id]: this.session?.id },
      select: { [this.options.authFields.id]: true },
    })

    if (!user) {
      throw new DbAuthError.UserNotFoundError()
    }

    return user
  }

  // creates and returns a user, first checking that the username/password
  // values pass validation
  async _createUser() {
    const { username, password, ...userAttributes } = this.params
    if (
      this._validateField('username', username) &&
      this._validateField('password', password)
    ) {
      const user = await this.dbAccessor.findUnique({
        where: { [this.options.authFields.username]: username },
      })
      if (user) {
        throw new DbAuthError.DuplicateUsernameError(
          username,
          this.options.signup?.errors?.usernameTaken
        )
      }

      // if we get here everything is good, call the app's signup handler and let
      // them worry about scrubbing data and saving to the DB
      const [hashedPassword, salt] = this._hashPassword(password)
      const newUser = await this.options.signup.handler({
        username,
        hashedPassword,
        salt,
        userAttributes,
      })

      return newUser
    }
  }

  // hashes a password using either the given `salt` argument, or creates a new
  // salt and hashes using that. Either way, returns an array with [hash, salt]
  _hashPassword(text: string, salt?: string) {
    const useSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString()

    return [
      CryptoJS.PBKDF2(text, useSalt, { keySize: 256 / 32 }).toString(),
      useSalt,
    ]
  }

  // figure out which auth method we're trying to call
  _getAuthMethod() {
    // try getting it from the query string, /.redwood/functions/auth?method=[methodName]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let methodName = this.event.queryStringParameters!.method as AuthMethodNames

    if (!DbAuthHandler.METHODS.includes(methodName) && this.params) {
      // try getting it from the body in JSON: { method: [methodName] }
      try {
        methodName = this.params.method
      } catch (e) {
        // there's no body, or it's not JSON, `handler` will return a 404
      }
    }

    return methodName
  }

  // checks that a single field meets validation requirements and
  // currently checks for presense only
  _validateField(name: string, value: string | undefined): value is string {
    // check for presense
    if (!value || value.trim() === '') {
      throw new DbAuthError.FieldRequiredError(
        name,
        this.options.signup?.errors?.fieldMissing
      )
    } else {
      return true
    }
  }

  _loginResponse(user: Record<string, any>, statusCode = 200) {
    const sessionData = { id: user[this.options.authFields.id] }

    // TODO: this needs to go into graphql somewhere so that each request makes
    // a new CSRF token and sets it in both the encrypted session and the
    // csrf-token header
    const csrfToken = DbAuthHandler.CSRF_TOKEN

    return [
      sessionData,
      {
        'csrf-token': csrfToken,
        ...this._createSessionHeader(sessionData, csrfToken),
      },
      { statusCode },
    ]
  }

  _logoutResponse(
    response?: Record<string, unknown>
  ): [string, Record<'Set-Cookie', string>] {
    return [
      response ? JSON.stringify(response) : '',
      {
        ...this._deleteSessionHeader,
      },
    ]
  }

  _ok(body: string, headers = {}, options = { statusCode: 200 }) {
    return {
      statusCode: options.statusCode,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  }

  _notFound() {
    return {
      statusCode: 404,
    }
  }

  _badRequest(message: string) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: message }),
      headers: { 'Content-Type': 'application/json' },
    }
  }
}
