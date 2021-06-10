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
