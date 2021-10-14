export class ServiceValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AbsenceValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} is not absent`) {
    super(message)
    this.name = 'AbsenceValidationError'
  }
}

export class AcceptanceValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} must be accepted`) {
    super(message)
    this.name = 'AcceptanceValidationError'
  }
}

export class ExclusionValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} is reserved`) {
    super(message)
    this.name = 'ExclusionValidationError'
  }
}

export class FormatValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} is not formatted correctly`) {
    super(message)
    this.name = 'FormatValidationError'
  }
}

export class InclusionValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} is reserved`) {
    super(message)
    this.name = 'InclusionValidationError'
  }
}

export class MinLengthValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: number,
    message = `${name} must have more than ${value} characters`
  ) {
    super(message)
    this.name = 'MinLengthValidationError'
  }
}

export class MaxLengthValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: number,
    message = `${name} must have less than ${value} characters`
  ) {
    super(message)
    this.name = 'MaxLengthValidationError'
  }
}

export class EqualLengthValidationError extends ServiceValidationError {
  constructor(
    name: sring,
    value: number,
    message = `${name} does not have exactly ${value} characters`
  ) {
    super(message)
    this.name = 'EqualLengthValidationError'
  }
}

export class BetweenLengthValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: Array<number>,
    message = `${name} must be between ${value[0]} and ${value[1]} characters`
  ) {
    super(message)
    this.name = 'BetweenLengthValidationError'
  }
}

export class PresenceValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} is not present`) {
    super(message)
    this.name = 'PresenceValidationError'
  }
}

export class IntegerNumericalityValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} is not an integer`) {
    super(message)
    this.name = 'IntegerNumericalityValidationError'
  }
}

export class LessThanNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: number,
    message = `${name} must be less than ${value}`
  ) {
    super(message)
    this.name = 'LessThanNumericalityValidationError'
  }
}

export class LessThanOrEqualNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: number,
    message = `${name} must be less than or equal to ${value}`
  ) {
    super(message)
    this.name = 'LessThanOrEqualNumericalityValidationError'
  }
}

export class GreaterThanNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: number,
    message = `${name} must be greater than ${value}`
  ) {
    super(message)
    this.name = 'GreaterThanNumericalityValidationError'
  }
}

export class GreaterThanOrEqualNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: number,
    message = `${name} must be greater than or equal to ${value}`
  ) {
    super(message)
    this.name = 'GreaterThanOrEqualNumericalityValidationError'
  }
}

export class EqualNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: number,
    message = `${name} must equal ${value}`
  ) {
    super(message)
    this.name = 'EqualNumericalityValidationError'
  }
}

export class OtherThanNumericalityValidationError extends ServiceValidationError {
  constructor(
    name: string,
    value: number,
    message = `${name} must not equal ${value}`
  ) {
    super(message)
    this.name = 'OtherThanNumericalityValidationError'
  }
}

export class EvenNumericalityValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} must be even`) {
    super(message)
    this.name = 'EvenNumericalityValidationError'
  }
}

export class OddNumericalityValidationError extends ServiceValidationError {
  constructor(name: string, message = `${name} must be odd`) {
    super(message)
    this.name = 'OddNumericalityValidationError'
  }
}

export class UniquenessValidationError extends ServiceValidationError {
  constructor(fields: Record<string, unknown>, message: string | undefined) {
    const names = Object.keys(fields).join(', ')
    const errorMessage = message ? message : `${names} must be unique`

    super(errorMessage)
    this.name = 'UniquenessValidationError'
  }
}
