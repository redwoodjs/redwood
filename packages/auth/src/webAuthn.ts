import {
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from './simplewebauthn'

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

export const isWebAuthnSupported = async () => {
  return await platformAuthenticatorIsAvailable()
}

export const isWebAuthnEnabled = () => !!document.cookie.match(/webAuthn/)

export const webAuthnAuthenticate = async () => {
  try {
    const optionsResponse = await fetch(
      `${global.RWJS_API_DBAUTH_URL}?method=authOptions`,
      {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }
    )
    const options = await optionsResponse.json()

    if (optionsResponse.status !== 200) {
      throw new WebAuthnAuthenticationError(
        `Could not start authentication: ${options.error}`
      )
    }

    const browserResponse = await startAuthentication(options)

    const authResponse = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'authenticate', ...browserResponse }),
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
    throw new WebAuthnAuthenticationError(
      `Error while authenticating: ${e.message}`
    )
  }
}

export const webAuthnRegister = async () => {
  try {
    const optionsResponse = await fetch(
      `${global.RWJS_API_DBAUTH_URL}?method=regOptions`,
      {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }
    )
    const options = await optionsResponse.json()

    if (optionsResponse.status !== 200) {
      throw new WebAuthnRegistrationError(
        `Could not start registration: ${options.error}`
      )
    }

    console.info(options)
    const regResponse = await startRegistration(options)

    const verifyResponse = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'register', ...regResponse }),
    })

    if (verifyResponse.status !== 200) {
      throw new WebAuthnRegistrationError(
        `Could not complete registration: ${options.error}`
      )
    } else {
      return true
    }
  } catch (e: any) {
    if (e.name === 'InvalidStateError') {
      throw new WebAuthnAlreadyRegisteredError()
    } else {
      throw new WebAuthnRegistrationError(
        `Error while registering: ${e.message}`
      )
    }
  }
}
