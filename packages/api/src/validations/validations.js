// Handles validating values in services

import * as ValidationErrors from './errors'

const VALIDATORS = {
  // requires that the given value is `null` or `undefined`
  absence: (name, value, options) => {
    if (value != null) {
      throw new ValidationErrors.AbsenceValidationError(name, options.message)
    }
  },

  // requires that the given field be `true` and nothing else, unless an array
  // of valid values is included with an `in` option
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

  // requires that the given value NOT be in the list of possible values in options.in
  exclusion: (name, value, options) => {
    let exclusionList = options.in || options

    if (exclusionList.includes(value)) {
      throw new ValidationErrors.ExclusionValidationError(name, options.message)
    }
  },

  format: (name, value, options) => {
    let pattern = options.pattern || options

    if (!pattern.test(value)) {
      throw new ValidationErrors.FormatValidationError(name, options.message)
    }
  },

  // requires that the given value be in the list of possible values in options.in
  inclusion: (name, value, options) => {
    let inclusionList = options.in || options

    if (!inclusionList.includes(value)) {
      throw new ValidationErrors.InclusionValidationError(name, options.message)
    }
  },

  length: (name, value, options) => {
    const len = value.toString().length

    if (options.min && len < options.min) {
      throw new ValidationErrors.MinLengthValidationError(name, options.message)
    }
    if (options.max && len > options.max) {
      throw new ValidationErrors.MaxLengthValidationError(name, options.message)
    }
    if (options.equal && len !== options.equal) {
      throw new ValidationErrors.EqualLengthValidationError(
        name,
        options.message
      )
    }
    if (
      options.between &&
      (len < options.between[0] || len > options.between[1])
    ) {
      throw new ValidationErrors.BetweenLengthValidationError(
        name,
        options.message
      )
    }
  },

  // requires that the given value is not `null` or `undefined`
  presence: (name, value, options) => {
    if (value == null) {
      throw new ValidationErrors.PresenceValidationError(name, options.message)
    }
  },
}

export const validate = (name, value, directives) => {
  for (const [validator, options] of Object.entries(directives)) {
    VALIDATORS[validator].call(this, name, value, options)
  }
}

export const validateUniqueness = (field, callback) => {
  console.info('field', field)
  console.info('callback', callback)
}
