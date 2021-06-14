export class NoSessionSecret extends Error {
  constructor() {
    super(
      'dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!'
    )
    this.name = 'NoSessionSecret'
  }
}

export class WrongVerbError extends Error {
  constructor(properVerb) {
    super(`Only accessible via ${properVerb}`)
    this.name = 'WrongVerbError'
  }
}

export class NotLoggedInError extends Error {
  constructor() {
    super(`Cannot retrieve user details without being logged in`)
    this.name = 'NotLoggedInError'
  }
}

export class UserNotFoundError extends Error {
  constructor(username) {
    if (username) {
      super(`User \`${username}\` not found`)
    } else {
      super(`User not found`)
    }

    this.name = 'UserNotFoundError'
  }
}

export class UsernameAndPasswordRequiredError extends Error {
  constructor() {
    super(`Both username and password are required`)
    this.name = 'UsernameAndPasswordRequiredError'
  }
}

export class FieldRequiredError extends Error {
  constructor(name) {
    super(`${name} is required`)
    this.name = 'FieldRequiredError'
  }
}

export class FieldFormatError extends Error {
  constructor(message) {
    super(message)
    this.name = 'FieldFormatError'
  }
}

export class DuplicateUsernameError extends Error {
  constructor(username) {
    super(`Username \`${username}\` already in use`)
    this.name = 'DuplicateUsernameError'
  }
}

export class IncorrectPasswordError extends Error {
  constructor() {
    super(`Incorrect password`)
    this.name = 'IncorrectPasswordError'
  }
}

export class CsrfTokenMismatchError extends Error {
  constructor() {
    super(`CSRF token mismatch`)
    this.name = 'CsrfTokenMismatchError'
  }
}

export class NoCookiesError extends Error {
  constructor() {
    super(`No cookies present`)
    this.name = 'NoCookiesError'
  }
}

export class NoSessionError extends Error {
  constructor() {
    super(`No session present`)
    this.name = 'NoSessionError'
  }
}

export class SessionDecryptionError extends Error {
  constructor() {
    super('Session has potentially be tampered with')
    this.name = 'SessionDecryptionError'
  }
}
