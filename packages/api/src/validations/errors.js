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

export class FormatValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is not formatted correctly`) {
    super(message)
    this.name = 'FormatValidationError'
  }
}

export class InclusionValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is reserved`) {
    super(message)
    this.name = 'InclusionValidationError'
  }
}

export class MinLengthValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is too short`) {
    super(message)
    this.name = 'MinLengthValidationError'
  }
}

export class MaxLengthValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is too long`) {
    super(message)
    this.name = 'MaxLengthValidationError'
  }
}

export class EqualLengthValidationError extends ServiceValidationError {
  constructor(name, message = `${name} does not equal required length`) {
    super(message)
    this.name = 'EqualLengthValidationError'
  }
}

export class BetweenLengthValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is not in required length range`) {
    super(message)
    this.name = 'BetweenLengthValidationError'
  }
}

export class PresenceValidationError extends ServiceValidationError {
  constructor(name, message = `${name} is not present`) {
    super(message)
    this.name = 'PresenceValidationError'
  }
}
