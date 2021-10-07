export class ServiceValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AbsenceValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is not absent`) {
    super(message)
    this.name = 'AbsenceValidationError'
  }
}

export class AcceptanceValidationError extends ServiceValidationError {
  constructor(name, message = `${name} must be accepted`) {
    super(message)
    this.name = 'AcceptanceValidationError'
  }
}

export class ExclusionValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is reserved`) {
    super(message)
    this.name = 'ExclusionValidationError'
  }
}

export class InclusionValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is reserved`) {
    super(message)
    this.name = 'InclusionValidationError'
  }
}

export class PresenceValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is not present`) {
    super(message)
    this.name = 'PresenceValidationError'
  }
}
