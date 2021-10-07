// Handles validating values in services
import * as ValidationErrors from './errors'

export const validate = (name, value, options) => {
  if (options.absence) {
    _validateAbsence(name, value, options.absence)
  }
  if (options.presence) {
    _validatePresence(name, value, options.presence)
  }
}

const _validatePresence = (name, value, options) => {
  if (value == null) {
    throw new ValidationErrors.PresenceValidationError(name, options.message)
  }
}

const _validateAbsence = (name, value, options) => {
  if (value != null) {
    throw new ValidationErrors.AbsenceValidationError(name, options.message)
  }
}

export const validateUniqueness = (field, callback) => {
  console.info('field', field)
  console.info('callback', callback)
}
