import {
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser'

class WebAuthnRegistrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebAuthnRegistrationError'
  }
}

class WebAuthnAuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebAuthnAuthenticationError'
  }
}

class WebAuthnAlreadyRegisteredError extends WebAuthnRegistrationError {
  constructor() {
    super('This device is already registered')
    this.name = 'WebAuthnAlreadyRegisteredError'
  }
}

class WebAuthnDeviceNotFoundError extends WebAuthnAuthenticationError {
  constructor() {
    super('WebAuthn device not found')
    this.name = 'WebAuthnDeviceNotFoundError'
  }
}

class WebAuthnNoAuthenticatorError extends WebAuthnAuthenticationError {
  constructor() {
    super(
      "This device was not recognized. Use username/password login, or if you're using iOS you can try reloading this page"
    )
    this.name = 'WebAuthnNoAuthenticatorError'
  }
}

const isSupported = async () => {
  return await platformAuthenticatorIsAvailable()
}

const isEnabled = () => !!document.cookie.match(/webAuthn/)

const authenticationOptions = async () => {
  let options

  try {
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.open(
      'GET',
      `${process.env.RWJS_API_DBAUTH_URL}?method=webAuthnAuthOptions`,
      false
    )
    xhr.setRequestHeader('content-type', 'application/json')
    xhr.send(null)

    options = JSON.parse(xhr.responseText)

    if (xhr.status !== 200) {
      if (options.error?.match(/username and password/)) {
        console.info('regex match')
        throw new WebAuthnDeviceNotFoundError()
      } else {
        console.info('no match')
        throw new WebAuthnAuthenticationError(
          `Could not start authentication: ${options.error}`
        )
      }
    }
  } catch (e: any) {
    console.error(e.message)
    throw new WebAuthnAuthenticationError(
      `Could not start authentication: ${e.message}`
    )
  }

  return options
}

const authenticate = async () => {
  if (!process.env.RWJS_API_DBAUTH_URL) {
    throw new Error('You need to set teh RWJS_API_DBAUTH_URL env variable')
  }

  const authOptions = await authenticationOptions()

  try {
    const browserResponse = await startAuthentication(authOptions)

    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.open('POST', process.env.RWJS_API_DBAUTH_URL, false)
    xhr.setRequestHeader('content-type', 'application/json')
    xhr.send(
      JSON.stringify({
        method: 'webAuthnAuthenticate',
        ...browserResponse,
      })
    )

    const options = JSON.parse(xhr.responseText)

    if (xhr.status !== 200) {
      throw new WebAuthnAuthenticationError(
        `Could not complete authentication: ${options.error}`
      )
    }
  } catch (e: any) {
    if (
      e.message.match(
        /No available authenticator recognized any of the allowed credentials/
      )
    ) {
      throw new WebAuthnNoAuthenticatorError()
    } else {
      throw new WebAuthnAuthenticationError(
        `Error while authenticating: ${e.message}`
      )
    }
  }

  return true
}

const registrationOptions = () => {
  let options

  try {
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.open(
      'GET',
      `${process.env.RWJS_API_DBAUTH_URL}?method=webAuthnRegOptions`,
      false
    )
    xhr.setRequestHeader('content-type', 'application/json')
    xhr.send(null)

    options = JSON.parse(xhr.responseText)

    if (xhr.status !== 200) {
      throw new WebAuthnRegistrationError(
        `Could not start registration: ${options.error}`
      )
    }
  } catch (e: any) {
    console.error(e)
    throw new WebAuthnRegistrationError(
      `Could not start registration: ${e.message}`
    )
  }

  return options
}

const register = async () => {
  if (!process.env.RWJS_API_DBAUTH_URL) {
    throw new Error('You need to set teh RWJS_API_DBAUTH_URL env variable')
  }

  const options = await registrationOptions()
  let regResponse

  try {
    regResponse = await startRegistration(options)
  } catch (e: any) {
    if (e.name === 'InvalidStateError') {
      throw new WebAuthnAlreadyRegisteredError()
    } else {
      throw new WebAuthnRegistrationError(
        `Error while registering: ${e.message}`
      )
    }
  }

  try {
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.open('POST', process.env.RWJS_API_DBAUTH_URL, false)
    xhr.setRequestHeader('content-type', 'application/json')
    xhr.send(JSON.stringify({ method: 'webAuthnRegister', ...regResponse }))

    const options = JSON.parse(xhr.responseText)

    if (xhr.status !== 200) {
      throw new WebAuthnRegistrationError(
        `Could not complete registration: ${options.error}`
      )
    }
  } catch (e: any) {
    throw new WebAuthnRegistrationError(`Error while registering: ${e.message}`)
  }

  return true
}

const WebAuthnClient = { isSupported, isEnabled, authenticate, register }

export default WebAuthnClient

export type WebAuthnClientType = typeof WebAuthnClient
