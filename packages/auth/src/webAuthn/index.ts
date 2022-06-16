import {
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser'

export class WebAuthnRegistrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebAuthnRegistrationError'
  }
}

export class WebAuthnAuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebAuthnAuthenticationError'
  }
}

export class WebAuthnAlreadyRegisteredError extends WebAuthnRegistrationError {
  constructor() {
    super('This device is already registered')
    this.name = 'WebAuthnAlreadyRegisteredError'
  }
}

export class WebAuthnDeviceNotFoundError extends WebAuthnAuthenticationError {
  constructor() {
    super('WebAuthn device not found')
    this.name = 'WebAuthnDeviceNotFoundError'
  }
}

export class WebAuthnNoAuthenticatorError extends WebAuthnAuthenticationError {
  constructor() {
    super(
      "This device was not recognized. Use username/password login, or if you're using iOS you can try reloading this page"
    )
    this.name = 'WebAuthnNoAuthenticatorError'
  }
}

export const isSupported = async () => {
  return await platformAuthenticatorIsAvailable()
}

export const isEnabled = () => !!document.cookie.match(/webAuthn/)

export const authenticationOptions = async () => {
  let response

  try {
    response = await fetch(
      `${global.RWJS_API_DBAUTH_URL}?method=webAuthnAuthOptions`,
      {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (e: any) {
    console.error(e.message)
    throw new WebAuthnAuthenticationError(
      `Could not start authentication: ${e.message}`
    )
  }

  const options = await response.json()

  if (response.status !== 200) {
    console.info(options)
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

  return options
}

export const authenticate = async () => {
  const options = await authenticationOptions()

  try {
    const browserResponse = await startAuthentication(options)

    const authResponse = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'webAuthnAuthenticate',
        ...browserResponse,
      }),
    })

    if (authResponse.status !== 200) {
      throw new WebAuthnAuthenticationError(
        `Could not complete authentication: ${
          (await authResponse.json()).error
        }`
      )
    } else {
      return true
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
}

export const registrationOptions = async () => {
  let optionsResponse

  try {
    optionsResponse = await fetch(
      `${global.RWJS_API_DBAUTH_URL}?method=webAuthnRegOptions`,
      {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (e: any) {
    console.error(e)
    throw new WebAuthnRegistrationError(
      `Could not start registration: ${e.message}`
    )
  }

  const options = await optionsResponse.json()

  if (optionsResponse.status !== 200) {
    throw new WebAuthnRegistrationError(
      `Could not start registration: ${options.error}`
    )
  }

  return options
}

export const register = async () => {
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

  let verifyResponse

  try {
    verifyResponse = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'webAuthnRegister', ...regResponse }),
    })
  } catch (e: any) {
    throw new WebAuthnRegistrationError(`Error while registering: ${e.message}`)
  }

  if (verifyResponse.status !== 200) {
    throw new WebAuthnRegistrationError(
      `Could not complete registration: ${options.error}`
    )
  } else {
    return true
  }
}
