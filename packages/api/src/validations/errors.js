export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AbsenceValidationError extends ValidationError {
  constructor(name, message = `${name} is present`) {
    super(message)
    this.name = 'AbsenceValidationError'
  }
}

export class PresenceValidationError extends ValidationError {
  constructor(name, message = `${name} is not present`) {
    super(message)
    this.name = 'PresenceValidationError'
  }
}
