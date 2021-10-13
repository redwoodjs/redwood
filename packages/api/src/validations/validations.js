// Handles validating values in services

import * as ValidationErrors from './errors'

const VALIDATORS = {
  // Requires that the given value is `null` or `undefined`
  //
  // { absence: true }
  // { absense: { message: '...' } }
  absence: (name, value, options) => {
    if (value != null) {
      throw new ValidationErrors.AbsenceValidationError(name, options.message)
    }
  },

  // Requires that the given field be `true` and nothing else, unless an array
  // of valid values is included with an `in` option
  //
  // { acceptance: true }
  // { acceptance: { in: ['true','1'], message: '...' } }
  acceptance: (name, value, options) => {
    let acceptedValues = [true]
    acceptedValues = acceptedValues.concat(options.in || [])

    if (!acceptedValues.includes(value)) {
      throw new ValidationErrors.AcceptanceValidationError(
        name,
        options.message
      )
    }
  },

  // Requires that the given value NOT be in the list of possible values
  //
  // { exclusion: ['foo', 'bar'] }
  // { exclusion: { in: ['foo','bar'], message: '...' } }
  exclusion: (name, value, options) => {
    let exclusionList = options.in || options

    if (exclusionList.includes(value)) {
      throw new ValidationErrors.ExclusionValidationError(name, options.message)
    }
  },

  // Requires that the given value match a regular expression
  //
  // { format: /^foobar$/ }
  // { format: { pattern: /^foobar$/, message: '...' } }
  format: (name, value, options) => {
    let pattern = options.pattern || options

    if (!pattern.test(value)) {
      throw new ValidationErrors.FormatValidationError(name, options.message)
    }
  },

  // Requires that the given value be in the list of possible values
  //
  // { inclusion: ['foo', 'bar'] }
  // { inclusion: { in: ['foo','bar'], message: '...' } }
  inclusion: (name, value, options) => {
    let inclusionList = options.in || options

    if (!inclusionList.includes(value)) {
      throw new ValidationErrors.InclusionValidationError(name, options.message)
    }
  },

  // Requires that the given string be a certain length:
  //
  // `min`: must be at least `min` characters
  // `ma`x`: must be no more than `max` characters
  // `equal`: must be exactly `equal` characters
  // `between`: an array consisting of the `min` and `max` length
  //
  // { length: { min: 4 } }
  // { length: { min: 2, max: 16 } }
  // { length: { between: [2, 16], message: '...' } }
  length: (name, value, options) => {
    const len = value.toString().length

    if (options.min && len < options.min) {
      throw new ValidationErrors.MinLengthValidationError(
        name,
        options.min,
        options.message
      )
    }
    if (options.max && len > options.max) {
      throw new ValidationErrors.MaxLengthValidationError(
        name,
        options.max,
        options.message
      )
    }
    if (options.equal && len !== options.equal) {
      throw new ValidationErrors.EqualLengthValidationError(
        name,
        options.equal,
        options.message
      )
    }
    if (
      options.between &&
      (len < options.between[0] || len > options.between[1])
    ) {
      throw new ValidationErrors.BetweenLengthValidationError(
        name,
        options.between,
        options.message
      )
    }
  },

  // Requires that number value meets some criteria:
  //
  // `integer`: value must be an integer
  // `lessThan`: value must be less than `lessThan`
  // `lessThanOrEqual`: value must be less than or equal to `lessThanOrEqual`
  // `greaterThan`: value must be greater than `greaterThan`
  // `greaterThanOrEqual`: value must be greater than or equal to `greaterThanOrEqual`
  // `equal`: value must equal `equal`
  // `otherThan`: value must be anything other than `otherThan`
  // `even`: value must be an even number
  // `odd`: value must be an odd number
  //
  // { numericality: { integer: true } }
  // { numericality: { greaterThan: 3.5, message: '...' } }
  numericality: (name, value, options) => {
    if (options.integer && value !== parseInt(value)) {
      throw new ValidationErrors.IntegerNumericalityValidationError(
        name,
        options.message
      )
    }
    if (options.lessThan && value >= options.lessThan) {
      throw new ValidationErrors.LessThanNumericalityValidationError(
        name,
        options.lessThan,
        options.message
      )
    }
    if (options.lessThanOrEqual && value > options.lessThanOrEqual) {
      throw new ValidationErrors.LessThanOrEqualNumericalityValidationError(
        name,
        options.lessThanOrEqual,
        options.message
      )
    }
    if (options.greaterThan && value <= options.greaterThan) {
      throw new ValidationErrors.GreaterThanNumericalityValidationError(
        name,
        options.greaterThan,
        options.message
      )
    }
    if (options.greaterThanOrEqual && value < options.greaterThanOrEqual) {
      throw new ValidationErrors.GreaterThanOrEqualNumericalityValidationError(
        name,
        options.greaterThanOrEqual,
        options.message
      )
    }
    if (options.equal && value !== options.equal) {
      throw new ValidationErrors.EqualNumericalityValidationError(
        name,
        options.equal,
        options.message
      )
    }
    if (options.otherThan && value === options.otherThan) {
      throw new ValidationErrors.OtherThanNumericalityValidationError(
        name,
        options.otherThan,
        options.message
      )
    }
    if (options.even && value % 2 !== 0) {
      throw new ValidationErrors.EvenNumericalityValidationError(
        name,
        options.message
      )
    }
    if (options.odd && value % 2 !== 1) {
      throw new ValidationErrors.OddNumericalityValidationError(
        name,
        options.message
      )
    }
  },

  // Requires that the given value is not `null` or `undefined`
  //
  // { presence: true }
  // { presence: { message: '...' } }
  presence: (name, value, options) => {
    if (value == null) {
      throw new ValidationErrors.PresenceValidationError(name, options.message)
    }
  },
}

// Main validation function, `directives` decides which actual validators
// above to use
//
// validate('firstName', 'Rob', { presence: true, length: { min: 2 } })
export const validate = (name, value, directives) => {
  for (const [validator, options] of Object.entries(directives)) {
    VALIDATORS[validator].call(this, name, value, options)
  }
}

// Wraps `callback` in a transaction to guarantee that `field` is not found in
// the database and that the `callback` is executed before someone else gets a
// chance to create the same value
export const validateUniqueness = (field, callback) => {
  console.info('field', field)
  console.info('callback', callback)
}
