import {
  browserSupportsWebauthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser'

export const isWebAuthnSupported = async () => {
  return browserSupportsWebauthn() && (await platformAuthenticatorIsAvailable())
}

export const webAuthnAuthenticate = async () => {
  try {
    const response = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials: 'same-origin',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'authOptions' }),
    })
    const options = await response.json()

    if (response.status !== 200) {
      return { error: `Could not start authentication: ${options.error}` }
    }

    const browserResponse = await startAuthentication(options)

    const verifyResponse = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials: 'same-origin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'authOptions', ...browserResponse }),
    })

    if (verifyResponse.status !== 200) {
      throw new Error(
        `Could not complete authentication: ${
          (await verifyResponse.json()).error
        }`
      )
    } else {
      return true
    }
  } catch (e: any) {
    throw new Error(`Error while authenticating: ${e.message}`)
  }
}

export const webAuthnRegister = async () => {
  try {
    const response = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials: 'same-origin',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'regOptions' }),
    })
    const options = await response.json()

    if (response.status !== 200) {
      return { error: `Could not start registration: ${options.error}` }
    }

    const browserResponse = await startRegistration(options)

    const verifyResponse = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials: 'same-origin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'register', ...browserResponse }),
    })

    if (verifyResponse.status !== 200) {
      throw new Error(`Could not complete registration: ${options.error}`)
    } else {
      return true
    }
  } catch (e: any) {
    if (e.name === 'InvalidStateError') {
      throw new Error(`This device is already registered`)
    } else {
      throw new Error(`Error while registering: ${e.message}`)
    }
  }
}
