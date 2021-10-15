// Handles validating values in services

import { PrismaClient } from '@prisma/client'

import * as ValidationErrors from './errors'

type AbsenceValidatorOptions =
  | boolean
  | {
      allowEmptyString?: boolean
      message?: string
    }

type AcceptanceValidatorOptions =
  | boolean
  | {
      in?: Array<unknown>
      message?: string
    }

type ExclusionValidatorOptions =
  | Array<unknown>
  | {
      in?: Array<unknown>
      message?: string
    }

type FormatValidatorOptions =
  | RegExp
  | {
      pattern?: RegExp
      message?: string
    }

type InclusionValidatorOptions =
  | Array<unknown>
  | {
      in?: Array<unknown>
      message?: string
    }

type LengthValidatorOptions = {
  min?: number
  max?: number
  equal?: number
  between?: Array<number>
  message?: string
}

type NumericalityValidatorOptions =
  | boolean
  | {
      integer?: boolean
      lessThan?: number
      lessThanOrEqual?: number
      greaterThan?: number
      greaterThanOrEqual?: number
      equal?: number
      otherThan?: number
      even?: boolean
      odd?: boolean
      message?: string
    }

type PresenceValidatorOptions =
  | boolean
  | {
      allowNull?: boolean
      allowUndefined?: boolean
      allowEmptyString?: boolean
      message?: string
    }

type ValidateDirectives = {
  absence?: AbsenceValidatorOptions
  acceptance?: AcceptanceValidatorOptions
  exclusion?: ExclusionValidatorOptions
  format?: FormatValidatorOptions
  inclusion?: InclusionValidatorOptions
  length?: LengthValidatorOptions
  numericality?: NumericalityValidatorOptions
  presence?: PresenceValidatorOptions
}

type UniquenessValidatorOptions = {
  message?: string
}

const VALIDATORS = {
  // Requires that the given value is `null` or `undefined`
  //
  // `allowEmptyString`: if true, counts "" as being absent (does not throw)
  //
  // { absence: true }
  // { absence: { allowEmptyString: true, message: '...' } }
  absence: (
    name: string,
    value: unknown,
    options: boolean | AbsenceValidatorOptions
  ) => {
    const absenceOptions = {
      allowEmptyString: false,
    }
    Object.assign(absenceOptions, options)
    const errorMessage =
      typeof options === 'object' ? options.message : undefined

    if (value === '') {
      if (!absenceOptions.allowEmptyString) {
        throw new ValidationErrors.AbsenceValidationError(name, errorMessage)
      }
    } else if (value != null) {
      throw new ValidationErrors.AbsenceValidationError(name, errorMessage)
    }
  },

  // Requires that the given field be `true` and nothing else, unless an array
  // of valid values is included with an `in` option
  //
  // { acceptance: true }
  // { acceptance: { in: ['true','1'], message: '...' } }
  acceptance: (
    name: string,
    value: unknown,
    options: AcceptanceValidatorOptions
  ) => {
    let acceptedValues: Array<unknown>

    if (typeof options === 'object') {
      acceptedValues = options.in || []
    } else {
      acceptedValues = [true]
    }
    const errorMessage =
      typeof options === 'object' ? options.message : undefined

    if (!acceptedValues.includes(value)) {
      throw new ValidationErrors.AcceptanceValidationError(name, errorMessage)
    }
  },

  // Requires that the given value NOT be in the list of possible values
  //
  // { exclusion: ['foo', 'bar'] }
  // { exclusion: { in: ['foo','bar'], message: '...' } }
  exclusion: (
    name: string,
    value: unknown,
    options: ExclusionValidatorOptions
  ) => {
    const exclusionList =
      (Array.isArray(options) && options) || options.in || []
    const errorMessage = Array.isArray(options) ? undefined : options.message

    if (exclusionList.includes(value)) {
      throw new ValidationErrors.ExclusionValidationError(name, errorMessage)
    }
  },

  // Requires that the given value match a regular expression
  //
  // { format: /^foobar$/ }
  // { format: { pattern: /^foobar$/, message: '...' } }
  format: (name: string, value: unknown, options: FormatValidatorOptions) => {
    const pattern = options instanceof RegExp ? options : options.pattern
    const errorMessage = options instanceof RegExp ? undefined : options.message

    if (pattern == null) {
      throw new ValidationErrors.FormatValidationError(
        name,
        'No pattern for format validation'
      )
    }

    if (!pattern.test(String(value))) {
      throw new ValidationErrors.FormatValidationError(name, errorMessage)
    }
  },

  // Requires that the given value be in the list of possible values
  //
  // { inclusion: ['foo', 'bar'] }
  // { inclusion: { in: ['foo','bar'], message: '...' } }
  inclusion: (
    name: string,
    value: unknown,
    options: InclusionValidatorOptions
  ) => {
    const inclusionList =
      (Array.isArray(options) && options) || options.in || []
    const errorMessage = Array.isArray(options) ? undefined : options.message

    if (!inclusionList.includes(value)) {
      throw new ValidationErrors.InclusionValidationError(name, errorMessage)
    }
  },

  // Requires that the given string be a certain length:
  //
  // `min`: must be at least `min` characters
  // `max`: must be no more than `max` characters
  // `equal`: must be exactly `equal` characters
  // `between`: an array consisting of the `min` and `max` length
  //
  // { length: { min: 4 } }
  // { length: { min: 2, max: 16 } }
  // { length: { between: [2, 16], message: '...' } }
  length: (name: string, value: unknown, options: LengthValidatorOptions) => {
    const len = String(value).length

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
  // { numericality: true }
  // { numericality: { integer: true } }
  // { numericality: { greaterThan: 3.5, message: '...' } }
  numericality: (
    name: string,
    value: unknown,
    options: NumericalityValidatorOptions
  ) => {
    if (typeof value !== 'number') {
      throw new ValidationErrors.TypeNumericalityValidationError(name)
    }

    // if there are no options, all we can do is check that value is a number
    if (typeof options === 'boolean') {
      return
    } else {
      if (options.integer && !Number.isInteger(value)) {
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
    }
  },

  // Requires that the given value is not `null` or `undefined`. By default will
  // consider an empty string to pass
  //
  // `allowEmptyString`: if set to `false` will throw an error if value is ""
  // `allowNull`: if `true` will allow `null`
  // `allowUndefined`: if `true` will allow `undefined`
  //
  // Default behavior is equivalent to:
  //   { allowNull: false, allowUndefined: false, allowEmptyString: true }
  //
  // { presence: true }
  // { presence: { allowEmptyString: false, message: '...' } }
  presence: (
    name: string,
    value: unknown,
    options: PresenceValidatorOptions
  ) => {
    const presenceOptions = {
      allowNull: false,
      allowUndefined: false,
      allowEmptyString: true,
    }
    Object.assign(presenceOptions, options)
    const errorMessage =
      typeof options === 'object' ? options.message : undefined

    if (!presenceOptions.allowNull && value === null) {
      throw new ValidationErrors.PresenceValidationError(name, errorMessage)
    }
    if (!presenceOptions.allowUndefined && value === undefined) {
      throw new ValidationErrors.PresenceValidationError(name, errorMessage)
    }
    if (!presenceOptions.allowEmptyString && value === '') {
      throw new ValidationErrors.PresenceValidationError(name, errorMessage)
    }
  },
}

// Main validation function, `directives` decides which actual validators
// above to use
//
// validate('firstName', 'Rob', { presence: true, length: { min: 2 } })
export const validate = (
  name: string,
  value: unknown,
  directives: ValidateDirectives
) => {
  for (const [validator, options] of Object.entries(directives)) {
    VALIDATORS[validator as keyof typeof VALIDATORS](name, value, options)
  }
}

// Run a custom validation function which should either throw or return nothing
export const validateWith = (
  name: string,
  value: unknown,
  func: (name: string, value: unknown) => void
) => {
  try {
    func(name, value)
  } catch (e) {
    const message = (e as Error).message || (e as string)
    throw new ValidationErrors.ServiceValidationError(message)
  }
}

// Wraps `callback` in a transaction to guarantee that `field` is not found in
// the database and that the `callback` is executed before someone else gets a
// chance to create the same value.
//
// As of Prisma v3.2.1 requires preview feature "interactiveTransactions" be
// enabled in prisma.schema:
//
//   previewFeatures = ["interactiveTransactions"]
//
// return validateUniqueness('user', { email: 'rob@redwoodjs.com' }, () => {
//   return db.create(data: { email })
// }, { message: '...'})
export const validateUniqueness = async (
  model: string,
  fields: Record<string, unknown>,
  callback: (tx: PrismaClient) => Promise<any>,
  options: UniquenessValidatorOptions = {}
) => {
  const db = new PrismaClient()

  return await db.$transaction(async (tx: PrismaClient) => {
    if (await tx[model].findFirst({ where: fields })) {
      throw new ValidationErrors.UniquenessValidationError(
        fields,
        options.message
      )
    }
    return callback(tx)
  })
}
