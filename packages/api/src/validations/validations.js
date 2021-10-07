// Handles validating values in services

import * as ValidationErrors from './errors'

const VALIDATORS = {
  // requires that the given value is `null` or `undefined`
  absence: (name, value, options) => {
    if (value != null) {
      throw new ValidationErrors.AbsenceValidationError(name, options.message)
    }
  },

  // requires that the given field be `true` and nothing else
  acceptance: (name, value, options) => {
    if (value !== true) {
      throw new ValidationErrors.AcceptanceValidationError(
        name,
        options.message
      )
    }
  },

  exclusion: (name, value, options) => {
    let exclusionList = options.in || options

    if (exclusionList.includes(value)) {
      throw new ValidationErrors.ExclusionValidationError(name, options.message)
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
