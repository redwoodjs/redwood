/* TODO: This file is a copy/paste of @simplewebauthn/browser's code because
 * this error prevents importing ESM modules more than one level deep:
 * https://github.com/MasterKale/SimpleWebAuthn/issues/168
 * Once we move to vite this problem should be solved and we can import the
 * regular lib like normal.
 */

import type {
  PublicKeyCredentialDescriptorJSON,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationCredentialJSON,
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticationCredentialJSON,
} from '@simplewebauthn/typescript-types'

function utf8StringToBuffer(value: string): ArrayBuffer {
  return new TextEncoder().encode(value)
}

function bufferToBase64URLString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode)
  }
  const base64String = btoa(str)
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64URLStringToBuffer(base64URLString: string): ArrayBuffer {
  const base64 = base64URLString.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (base64.length % 4)) % 4
  const padded = base64.padEnd(base64.length + padLength, '=')
  const binary = atob(padded)
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return buffer
}

function browserSupportsWebauthn() {
  return (
    (window === null || window === void 0
      ? void 0
      : window.PublicKeyCredential) !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  )
}

function toPublicKeyCredentialDescriptor(
  descriptor: PublicKeyCredentialDescriptorJSON
) {
  const { id } = descriptor
  return {
    ...descriptor,
    id: base64URLStringToBuffer(id),
    transports: descriptor.transports,
  }
}

function isValidDomain(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname)
  )
}

class WebAuthnError extends Error {
  constructor(message: string, name = 'WebAuthnError') {
    super(message)
    this.name = name
  }
}

function identifyRegistrationError({
  error,
  options,
}: {
  error: Error
  options: CredentialCreationOptions
}): WebAuthnError | Error {
  var _a, _b
  const { publicKey } = options
  if (!publicKey) {
    throw Error('options was missing required publicKey property')
  }
  if (error.name === 'AbortError') {
    if (options.signal === new AbortController().signal) {
      return new WebAuthnError(
        'Registration ceremony was sent an abort signal',
        'AbortError'
      )
    }
  } else if (error.name === 'ConstraintError') {
    if (
      ((_a = publicKey.authenticatorSelection) === null || _a === void 0
        ? void 0
        : _a.requireResidentKey) === true
    ) {
      return new WebAuthnError(
        'Discoverable credentials were required but no available authenticator supported it',
        'ConstraintError'
      )
    } else if (
      ((_b = publicKey.authenticatorSelection) === null || _b === void 0
        ? void 0
        : _b.userVerification) === 'required'
    ) {
      return new WebAuthnError(
        'User verification was required but no available authenticator supported it',
        'ConstraintError'
      )
    }
  } else if (error.name === 'InvalidStateError') {
    return new WebAuthnError(
      'The authenticator was previously registered',
      'InvalidStateError'
    )
  } else if (error.name === 'NotAllowedError') {
    return new WebAuthnError(
      'User clicked cancel, or the registration ceremony timed out',
      'NotAllowedError'
    )
  } else if (error.name === 'NotSupportedError') {
    const validPubKeyCredParams = publicKey.pubKeyCredParams.filter(
      (param) => param.type === 'public-key'
    )
    if (validPubKeyCredParams.length === 0) {
      return new WebAuthnError(
        'No entry in pubKeyCredParams was of type "public-key"',
        'NotSupportedError'
      )
    }
    return new WebAuthnError(
      'No available authenticator supported any of the specified pubKeyCredParams algorithms',
      'NotSupportedError'
    )
  } else if (error.name === 'SecurityError') {
    const effectiveDomain = window.location.hostname
    if (!isValidDomain(effectiveDomain)) {
      return new WebAuthnError(
        `${window.location.hostname} is an invalid domain`,
        'SecurityError'
      )
    } else if (publicKey.rp.id !== effectiveDomain) {
      return new WebAuthnError(
        `The RP ID "${publicKey.rp.id}" is invalid for this domain`,
        'SecurityError'
      )
    }
  } else if (error.name === 'TypeError') {
    if (publicKey.user.id.byteLength < 1 || publicKey.user.id.byteLength > 64) {
      return new WebAuthnError(
        'User ID was not between 1 and 64 characters',
        'TypeError'
      )
    }
  } else if (error.name === 'UnknownError') {
    return new WebAuthnError(
      'The authenticator was unable to process the specified options, or could not create a new credential',
      'UnknownError'
    )
  }
  return error
}

async function startRegistration(
  creationOptionsJSON: PublicKeyCredentialCreationOptionsJSON
): Promise<RegistrationCredentialJSON> {
  if (!browserSupportsWebauthn()) {
    throw new Error('WebAuthn is not supported in this browser')
  }
  const publicKey = {
    ...creationOptionsJSON,
    challenge: base64URLStringToBuffer(creationOptionsJSON.challenge),
    user: {
      ...creationOptionsJSON.user,
      id: utf8StringToBuffer(creationOptionsJSON.user.id),
    },
    excludeCredentials: creationOptionsJSON.excludeCredentials.map(
      toPublicKeyCredentialDescriptor
    ),
  }
  const options = { publicKey }
  let credential
  try {
    //@ts-ignore
    credential = await global.navigator.credentials.create(options)
  } catch (err) {
    //@ts-ignore
    throw identifyRegistrationError({ error: err, options })
  }
  if (!credential) {
    throw new Error('Registration was not completed')
  }
  //@ts-ignore
  const { id, rawId, response, type } = credential
  const credentialJSON = {
    id,
    rawId: bufferToBase64URLString(rawId),
    response: {
      attestationObject: bufferToBase64URLString(response.attestationObject),
      clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
    },
    type,
    //@ts-ignore
    clientExtensionResults: credential.getClientExtensionResults(),
  }
  if (typeof response.getTransports === 'function') {
    //@ts-ignore
    credentialJSON.transports = response.getTransports()
  }
  return credentialJSON
}

function bufferToUTF8String(value: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(value)
}

function identifyAuthenticationError({
  error,
  options,
}: {
  error: Error
  options: CredentialRequestOptions
}): WebAuthnError | Error {
  var _a
  const { publicKey } = options
  if (!publicKey) {
    throw Error('options was missing required publicKey property')
  }
  if (error.name === 'AbortError') {
    if (options.signal === new AbortController().signal) {
      return new WebAuthnError(
        'Authentication ceremony was sent an abort signal',
        'AbortError'
      )
    }
  } else if (error.name === 'NotAllowedError') {
    if (
      (_a = publicKey.allowCredentials) === null || _a === void 0
        ? void 0
        : _a.length
    ) {
      return new WebAuthnError(
        'No available authenticator recognized any of the allowed credentials',
        'NotAllowedError'
      )
    }
    return new WebAuthnError(
      'User clicked cancel, or the authentication ceremony timed out',
      'NotAllowedError'
    )
  } else if (error.name === 'SecurityError') {
    const effectiveDomain = window.location.hostname
    if (!isValidDomain(effectiveDomain)) {
      return new WebAuthnError(
        `${window.location.hostname} is an invalid domain`,
        'SecurityError'
      )
    } else if (publicKey.rpId !== effectiveDomain) {
      return new WebAuthnError(
        `The RP ID "${publicKey.rpId}" is invalid for this domain`,
        'SecurityError'
      )
    }
  } else if (error.name === 'UnknownError') {
    return new WebAuthnError(
      'The authenticator was unable to process the specified options, or could not create a new assertion signature',
      'UnknownError'
    )
  }
  return error
}

async function startAuthentication(
  requestOptionsJSON: PublicKeyCredentialRequestOptionsJSON
): Promise<AuthenticationCredentialJSON> {
  var _a, _b
  if (!browserSupportsWebauthn()) {
    throw new Error('WebAuthn is not supported in this browser')
  }
  let allowCredentials
  if (
    ((_a = requestOptionsJSON.allowCredentials) === null || _a === void 0
      ? void 0
      : _a.length) !== 0
  ) {
    allowCredentials =
      (_b = requestOptionsJSON.allowCredentials) === null || _b === void 0
        ? void 0
        : _b.map(toPublicKeyCredentialDescriptor)
  }
  const publicKey = {
    ...requestOptionsJSON,
    challenge: base64URLStringToBuffer(requestOptionsJSON.challenge),
    allowCredentials,
  }
  const options = { publicKey }
  let credential
  try {
    //@ts-ignore
    credential = await navigator.credentials.get(options)
  } catch (err) {
    //@ts-ignore
    throw identifyAuthenticationError({ error: err, options })
  }
  if (!credential) {
    throw new Error('Authentication was not completed')
  }
  //@ts-ignore
  const { id, rawId, response, type } = credential
  let userHandle = undefined
  if (response.userHandle) {
    userHandle = bufferToUTF8String(response.userHandle)
  }
  return {
    id,
    rawId: bufferToBase64URLString(rawId),
    response: {
      authenticatorData: bufferToBase64URLString(response.authenticatorData),
      clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
      signature: bufferToBase64URLString(response.signature),
      userHandle,
    },
    type,
    //@ts-ignore
    clientExtensionResults: credential.getClientExtensionResults(),
  }
}

async function platformAuthenticatorIsAvailable(): Promise<boolean> {
  if (!browserSupportsWebauthn()) {
    return false
  }
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
}

export {
  browserSupportsWebauthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
}
