export class NoSessionSecret extends Error {
  constructor() {
    super(
      'dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!'
    )
    this.name = 'NoSessionSecret'
  }
}

export class NoSessionExpiration extends Error {
  constructor() {
    super('dbAuth requires login expiration time, in seconds')
    this.name = 'NoSessionExpiration'
  }
}

export class NoLoginHandler extends Error {
  constructor() {
    super('dbAuth requires a login handler in order to log in a user')
    this.name = 'NoLoginHandler'
  }
}

export class NoSignupHandler extends Error {
  constructor() {
    super('dbAuth requires a signup handler in order to create new users')
    this.name = 'NoSignupHandler'
  }
}

export class UnknownAuthMethod extends Error {
  constructor(name: string) {
    super(`Unknown auth method '${name}'`)
    this.name = 'UnknownAuthMethod'
  }
}

export class WrongVerbError extends Error {
  constructor(properVerb: string) {
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
  constructor(
    username: string | undefined = undefined,
    message: string | undefined = 'Username ${username} not found'
  ) {
    if (username) {
      super(message.replace(/\$\{username\}/g, username))
    } else {
      super(`User not found`)
    }

    this.name = 'UserNotFoundError'
  }
}

export class UsernameAndPasswordRequiredError extends Error {
  constructor(
    message: string | undefined = 'Both username and password are required'
  ) {
    super(message)
    this.name = 'UsernameAndPasswordRequiredError'
  }
}

export class NoUserIdError extends Error {
  constructor() {
    super(
      'loginHandler() must return an object with an `id` field as set in `authFields.id`'
    )
    this.name = 'NoUserIdError'
  }
}

export class FieldRequiredError extends Error {
  constructor(
    name: string,
    message: string | undefined = '${field} is required'
  ) {
    super(message.replace(/\$\{field\}/g, name))
    this.name = 'FieldRequiredError'
  }
}

export class DuplicateUsernameError extends Error {
  constructor(
    username: string,
    message: string | undefined = 'Username `${username}` already in use'
  ) {
    super(message.replace(/\$\{username\}/g, username))
    this.name = 'DuplicateUsernameError'
  }
}

export class IncorrectPasswordError extends Error {
  constructor(
    username: string,
    message: string | undefined = 'Incorrect password for ${username}'
  ) {
    super(message.replace(/\$\{username\}/g, username))
    this.name = 'IncorrectPasswordError'
  }
}

export class CsrfTokenMismatchError extends Error {
  constructor() {
    super(`CSRF token mismatch`)
    this.name = 'CsrfTokenMismatchError'
  }
}

export class SessionDecryptionError extends Error {
  constructor() {
    super('Session has potentially be tampered with')
    this.name = 'SessionDecryptionError'
  }
}
