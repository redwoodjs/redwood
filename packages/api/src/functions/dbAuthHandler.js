import CryptoJS from 'crypto-js'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

export const WrongVerbError = class extends Error {
  constructor(properVerb) {
    super(`Only accessible via ${properVerb}`)
    this.name = 'WrongVerbError'
  }
}

export const NotLoggedInError = class extends Error {
  constructor() {
    super(`Cannot retrieve user details without being logged in`)
    this.name = 'NotLoggedInError'
  }
}

export const UserNotFoundError = class extends Error {
  constructor(username) {
    if (username) {
      super(`User \`${username}\` not found`)
    } else {
      super(`User not found`)
    }

    this.name = 'UserNotFoundError'
  }
}

export const UsernameAndPasswordRequiredError = class extends Error {
  constructor() {
    super(`Both username and password are required`)
    this.name = 'UsernameAndPasswordRequiredError'
  }
}

export const FieldRequiredError = class extends Error {
  constructor(name) {
    super(`${name} is required`)
    this.name = 'FieldRequiredError'
  }
}

export const FieldFormatError = class extends Error {
  constructor(message) {
    super(message)
    this.name = 'FieldFormatError'
  }
}

export const DuplicateUsernameError = class extends Error {
  constructor(username) {
    super(`Username \`${username}\` already in use`)
    this.name = 'DuplicateUsernameError'
  }
}

export const IncorrectPasswordError = class extends Error {
  constructor() {
    super(`Incorrect password`)
    this.name = 'IncorrectPasswordError'
  }
}

export const CsrfTokenMismatchError = class extends Error {
  constructor() {
    super(`CSRF token mismatch`)
    this.name = 'CsrfTokenMismatchError'
  }
}

export const NoCookiesError = class extends Error {
  constructor() {
    super(`No cookies present`)
    this.name = 'NoCookiesError'
  }
}

export const NoSessionError = class extends Error {
  constructor() {
    super(`No session present`)
    this.name = 'NoSessionError'
  }
}

export const SessionDecryptionError = class extends Error {
  constructor() {
    super('Session has potentially be tampered with')
    this.name = 'SessionDecryptionError'
  }
}

// all the attributes of the cookie other than the value itself
const cookieMeta = () => [
  `Path=/`,
  `Domain=${process.env.SELF_HOST.split('//')[1].split(':')[0]}`,
  'HttpOnly',
  'SameSite=Strict',
  'Secure',
]

// maps the auth functions to their required HTTP verb for access
const METHOD_VERBS = {
  login: 'POST',
  logout: 'POST',
  signup: 'POST',
  currentUser: 'GET',
  getToken: 'GET',
}

// convert to the UTC datetime string that's required for cookies
export const futureExpiresDate = () => {
  let futureDate = new Date()
  futureDate.setSeconds(futureDate.getSeconds() + global.options.loginExpires)

  return futureDate.toUTCString()
}

// default to epoch when we want to expire
export const pastExpiresDate = () => {
  return new Date(1970, 0, 1).toUTCString()
}

// returns the proper prisma db accessor based on the model name, like `db.user`
export const dbAccessor = () => {
  return global.db[global.options.authModelAccessor]
}

// returns the Set-Cookie header to be returned in the request (effectively creates the session)
export const createSessionHeader = (data, csrfToken) => {
  const session = JSON.stringify(data) + ';' + csrfToken
  const encrypted = CryptoJS.AES.encrypt(session, process.env.SESSION_SECRET)
  const cookie = [
    `session=${encrypted.toString()}`,
    ...cookieAttributes({ expires: 'future' }),
  ].join(';')

  return { 'Set-Cookie': cookie }
}

// returns the Set-Cookie header to mark the cookie as expired ("deletes" the session)
export const deleteSessionHeader = () => {
  return {
    'Set-Cookie': ['session=', ...cookieAttributes({ expires: 'now' })].join(
      ';'
    ),
  }
}

// returns all the cookie attributes in an array with the proper expiration date
//
// pass the argument `expires` set to "now" to get the attributes needed to expire
// the session, any other string will (or even null) will return the attributes to
// expire the session at the `futureExpiresDate`
export const cookieAttributes = (options = { expires: 'future' }) => {
  const meta = JSON.parse(JSON.stringify(cookieMeta()))
  const date =
    options.expires === 'now' ? pastExpiresDate() : futureExpiresDate()
  meta.push(`Expires=${date}`)

  return meta
}

export const generateCsrfToken = () => {
  return uuidv4()
}

// checks the CSRF token in the header against the CSRF token in the session and
// throw an error if they are not the same (not used yet)
export const validateCsrf = () => {
  if (global.sessionCsrfToken !== global.headerCsrfToken) {
    throw new CsrfTokenMismatchError()
  }
  return true
}

// returns the actual value of the session cookie
export const getSession = () => {
  if (typeof global.event.headers.cookie === 'undefined') {
    return null
  }

  const cookies = global.event.headers.cookie.split(';')
  const sessionCookie = cookies.find((cook) => {
    return cook.split('=')[0].trim() === 'session'
  })

  if (!sessionCookie || sessionCookie === 'session=') {
    return null
  }

  return sessionCookie.split('=')[1].trim()
}

// decrypts the session cookie and returns an array: [data, csrf]
export const decryptSession = () => {
  const session = getSession()
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
    throw new SessionDecryptionError()
  }
}

// verifies that a username and password are correct, and returns the user if so
export const verifyUser = async (username, password) => {
  // do we have all the query params we need to check the user?
  if (
    !username ||
    username.toString().trim() === '' ||
    !password ||
    password.toString().trim() === ''
  ) {
    throw new UsernameAndPasswordRequiredError()
  }

  // does user exist?
  const user = await dbAccessor().findUnique({
    where: { [global.options.authFields.username]: username },
  })

  if (!user) {
    throw new UserNotFoundError(username)
  }

  // is password correct?
  const [hashedPassword, _salt] = hashPassword(
    password,
    user[global.options.authFields.salt]
  )
  if (hashedPassword === user[global.options.authFields.hashedPassword]) {
    return user
  } else {
    throw new IncorrectPasswordError()
  }
}

// gets the user from the database and returns it as an object with
// `excludeUserFields` fields stripped out
export const getCurrentUser = async () => {
  if (!global.session?.id) {
    throw new NotLoggedInError()
  }

  const user = await dbAccessor().findUnique({
    where: { [global.options.authFields.id]: global.session?.id },
  })

  if (!user) {
    throw new UserNotFoundError()
  }

  const exclude = [
    global.options.authFields.hashedPassword,
    global.options.authFields.salt,
    ...global.options.excludeUserFields,
  ]

  const userArray = Object.entries(user)
  const filteredUser = userArray.filter(
    ([key, _value]) => !exclude.includes(key)
  )
  return Object.fromEntries(filteredUser)
}

// creates and returns a user, first checking that the username/password
// values pass validation
export const createUser = async () => {
  const { username, password, ...userAttributes } = JSON.parse(
    global.event.body
  )
  validateField('username', username)
  validateField('password', password)

  let user = await dbAccessor().findUnique({
    where: { [global.options.authFields.username]: username },
  })
  if (user) {
    throw new DuplicateUsernameError(username)
  }

  // if we get here everything is good, call the app's signup handler and let
  // them worry about scrubbing data and saving to the DB
  const [hashedPassword, salt] = hashPassword(password)
  const newUser = await global.options.signupHandler({
    username,
    hashedPassword,
    salt,
    userAttributes,
  })

  return newUser
}

// hashes a password using either the given `salt` argument, or creates a new
// salt and hashes using that. Either way, returns an array with [hash, salt]
export const hashPassword = (text, salt) => {
  const useSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString()

  return [
    CryptoJS.PBKDF2(text, useSalt, { keySize: 256 / 32 }).toString(),
    useSalt,
  ]
}

// figure out which auth method we're trying to call
export const getAuthMethod = () => {
  // first, try getting the method name out of the URL in the form of /.redwood/functions/auth/[methodName]
  let methodName = global.event.path.split('/').pop()

  if (!methods[methodName]) {
    // next, try getting it from the query string instead, /.redwood/functions/auth?method=[methodName]
    methodName = global.event.queryStringParameters.method
  }

  if (!methods[methodName]) {
    // finally, try getting it from the body in JSON: { method: [methodName] }
    try {
      methodName = JSON.parse(global.event.body).method
    } catch (e) {
      // there's no body, or it's not JSON, `handler` will return a 404
    }
  }

  return methodName
}

// checks that a single field meets validation requirements and
// currently checks for presense only
export const validateField = (name, value) => {
  // check for presense
  if (!value || value === '' || value.trim() === '') {
    throw new FieldRequiredError(name)
  } else {
    return true
  }
}

export const logoutResponse = (message) => {
  return [
    message ? JSON.stringify({ message }) : '',
    {
      ...deleteSessionHeader(),
    },
  ]
}

export const methods = {
  login: async () => {
    const { username, password } = JSON.parse(global.event.body)
    const user = await verifyUser(username, password)
    const sessionData = { id: user[global.options.authFields.id] }

    // this needs to go into graphql somewhere so that each request makes a new CSRF token
    // and sets it in both the encrypted session and the x-csrf-token header
    const csrfToken = generateCsrfToken()

    return [
      sessionData,
      {
        'X-CSRF-Token': csrfToken,
        ...createSessionHeader(sessionData, csrfToken),
      },
    ]
  },

  logout: () => {
    return logoutResponse()
  },

  signup: async () => {
    try {
      const user = await createUser()
      const sessionData = { id: user[global.options.authFields.id] }
      const csrfToken = generateCsrfToken()

      return [
        sessionData,
        {
          'X-CSRF-Token': csrfToken,
          ...createSessionHeader(sessionData, csrfToken),
        },
        created,
      ]
    } catch (e) {
      return logoutResponse(e.message)
    }
  },

  // converts the currentUser data to a JWT. returns `null` if session is not present
  getToken: async () => {
    try {
      const user = await getCurrentUser()
      const token = jwt.sign(JSON.stringify(user), process.env.SESSION_SECRET)

      return [token]
    } catch (e) {
      if (e instanceof NotLoggedInError) {
        return logoutResponse()
      } else {
        return logoutResponse(e.message)
      }
    }
  },
}

export const goodStatus = (statusCode, body, headers = {}) => {
  return {
    statusCode,
    body,
    headers: { 'Content-Type': 'application/json', ...headers },
  }
}

export const ok = (body, headers = {}) => {
  return goodStatus(200, body, headers)
}

export const created = (body, headers = {}) => {
  return goodStatus(201, body, headers)
}

export const notFound = () => {
  return {
    statusCode: 404,
  }
}

export const badRequest = (message) => {
  return {
    statusCode: 400,
    body: { message },
    headers: { 'Content-Type': 'application/json' },
  }
}

export const setGlobalContext = (event, context, options = {}) => {
  global.event = event
  global.context = context
  global.options = options
  global.db = global.options.db
  global.headerCsrfToken = global.event.headers['x-csrf-token']

  const [session, csrfToken] = decryptSession()
  global.session = session
  global.sessionCsrfToken = csrfToken
}

// actual entry point, call this in the auth.js function passing in config options
// as the third argument
export const dbAuthHandler = async (...args) => {
  try {
    setGlobalContext(...args)
  } catch (e) {
    // if session can't be decrypted, log out user immediately
    if (e instanceof SessionDecryptionError) {
      return ok(...logoutResponse())
    }
  }

  try {
    const method = getAuthMethod(global.event)

    // return a 404 if the auth method doesn't exist or the request didn't
    // use the required HTTP verb
    if (!methods[method] || global.event.httpMethod !== METHOD_VERBS[method]) {
      return notFound()
    }

    // call whatever auth method was requested and return the body and headers
    const [body, headers, statusFunction] = await methods[method]()

    if (statusFunction) {
      return statusFunction(body, headers)
    } else {
      return ok(body, headers)
    }
  } catch (e) {
    if (e instanceof WrongVerbError) {
      return notFound()
    } else {
      return badRequest(e.message)
    }
  }
}
