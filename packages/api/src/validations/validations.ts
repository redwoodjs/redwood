// Handles validating values in services

import { PrismaClient } from '@prisma/client'
import pascalcase from 'pascalcase'

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

type EmailValidatorOptions =
  | boolean
  | {
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
      positive?: boolean
      negative?: boolean
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

type UniquenessWhere = Record<'AND' | 'NOT', Array<Record<string, unknown>>>

const VALIDATORS = {
  // Requires that the given value is `null` or `undefined`
  //
  // `allowEmptyString`: if true, counts "" as being absent (does not throw)
  //
  // { absence: true }
  // { absence: { allowEmptyString: true, message: '...' } }
  absence: (value: unknown, name: string, options: AbsenceValidatorOptions) => {
    const absenceOptions = { allowEmptyString: false }
    Object.assign(absenceOptions, options)

    if (value === '') {
      if (!absenceOptions.allowEmptyString) {
        validationError('absence', name, options)
      }
    } else if (value != null) {
      validationError('absence', name, options)
    }
  },

  // Requires that the given field be `true` and nothing else, unless an array
  // of valid values is included with an `in` option
  //
  // { acceptance: true }
  // { acceptance: { in: ['true','1'], message: '...' } }
  acceptance: (
    value: unknown,
    name: string,
    options: AcceptanceValidatorOptions
  ) => {
    let acceptedValues: Array<unknown>

    if (typeof options === 'object') {
      acceptedValues = options.in || []
    } else {
      acceptedValues = [true]
    }

    if (!acceptedValues.includes(value)) {
      validationError('acceptance', name, options)
    }
  },

  // Requires that the given value be formatted like an email address. Uses a
  // very simple regex which checks for at least 1 character that is not an @,
  // then an @, then at least one character that isn't a period, then a period,
  // then any character. There cannot be any spaces present.
  //
  // { email: true }
  // { email: { message: '...' } }
  email: (value: unknown, name: string, options: EmailValidatorOptions) => {
    const pattern = /^[^@\s]+@[^.\s]+\.[^\s]+$/

    if (!pattern.test(String(value))) {
      validationError('email', name, options)
    }
  },

  // Requires that the given value NOT be in the list of possible values
  //
  // { exclusion: ['foo', 'bar'] }
  // { exclusion: { in: ['foo','bar'], message: '...' } }
  exclusion: (
    value: unknown,
    name: string,
    options: ExclusionValidatorOptions
  ) => {
    const exclusionList =
      (Array.isArray(options) && options) || options.in || []

    if (exclusionList.includes(value)) {
      validationError('exclusion', name, options)
    }
  },

  // Requires that the given value match a regular expression
  //
  // { format: /^foobar$/ }
  // { format: { pattern: /^foobar$/, message: '...' } }
  format: (value: unknown, name: string, options: FormatValidatorOptions) => {
    const pattern = options instanceof RegExp ? options : options.pattern

    if (pattern == null) {
      throw new ValidationErrors.FormatValidationError(
        name,
        'No pattern for format validation'
      )
    }

    if (!pattern.test(String(value))) {
      validationError('format', name, options)
    }
  },

  // Requires that the given value be in the list of possible values
  //
  // { inclusion: ['foo', 'bar'] }
  // { inclusion: { in: ['foo','bar'], message: '...' } }
  inclusion: (
    value: unknown,
    name: string,
    options: InclusionValidatorOptions
  ) => {
    const inclusionList =
      (Array.isArray(options) && options) || options.in || []

    if (!inclusionList.includes(value)) {
      validationError('inclusion', name, options)
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
  length: (value: unknown, name: string, options: LengthValidatorOptions) => {
    const len = String(value).length

    if (options.min && len < options.min) {
      validationError('minLength', name, options, { min: options.min })
    }
    if (options.max && len > options.max) {
      validationError('maxLength', name, options, { max: options.max })
    }
    if (options.equal && len !== options.equal) {
      validationError('equalLength', name, options, { equal: options.equal })
    }
    if (
      options.between &&
      (len < options.between[0] || len > options.between[1])
    ) {
      validationError('betweenLength', name, options, {
        min: options.between[0],
        max: options.between[1],
      })
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
  // `positive`: value must be a positive number
  // `negative`: value must be a negative number
  //
  // { numericality: true }
  // { numericality: { integer: true } }
  // { numericality: { greaterThan: 3.5, message: '...' } }
  numericality: (
    value: unknown,
    name: string,
    options: NumericalityValidatorOptions
  ) => {
    if (typeof value !== 'number') {
      validationError('typeNumericality', name, options)
    }

    // if there are no options, all we can do is check that value is a number
    if (typeof options === 'boolean') {
      return
    } else {
      if (options.integer && !Number.isInteger(value)) {
        validationError('integerNumericality', name, options)
      }
      if (options.lessThan && (value as number) >= options.lessThan) {
        validationError('lessThanNumericality', name, options, {
          lessThan: options.lessThan,
        })
      }
      if (
        options.lessThanOrEqual &&
        (value as number) > options.lessThanOrEqual
      ) {
        validationError('lessThanOrEqualNumericality', name, options, {
          lessThanOrEqual: options.lessThanOrEqual,
        })
      }
      if (options.greaterThan && (value as number) <= options.greaterThan) {
        validationError('greaterThanNumericality', name, options, {
          greaterThan: options.greaterThan,
        })
      }
      if (
        options.greaterThanOrEqual &&
        (value as number) < options.greaterThanOrEqual
      ) {
        validationError('greaterThanOrEqualNumericality', name, options, {
          greaterThanOrEqual: options.greaterThanOrEqual,
        })
      }
      if (options.equal && value !== options.equal) {
        validationError('equalNumericality', name, options, {
          equal: options.equal,
        })
      }
      if (options.otherThan && value === options.otherThan) {
        validationError('otherThanNumericality', name, options, {
          otherThan: options.otherThan,
        })
      }
      if (options.even && (value as number) % 2 !== 0) {
        validationError('evenNumericality', name, options)
      }
      if (options.odd && (value as number) % 2 !== 1) {
        validationError('oddNumericality', name, options)
      }
      if (options.positive && (value as number) <= 0) {
        validationError('positiveNumericality', name, options)
      }
      if (options.negative && (value as number) >= 0) {
        validationError('negativeNumericality', name, options)
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
    value: unknown,
    name: string,
    options: PresenceValidatorOptions
  ) => {
    const presenceOptions = {
      allowNull: false,
      allowUndefined: false,
      allowEmptyString: true,
    }
    Object.assign(presenceOptions, options)

    if (
      (!presenceOptions.allowNull && value === null) ||
      (!presenceOptions.allowUndefined && value === undefined) ||
      (!presenceOptions.allowEmptyString && value === '')
    ) {
      validationError('presence', name, options)
    }
  },
}

// Turns the keys of an object into a comma-delimited string
//
// { email: 'rob@redwood.com', name: 'Rob' } => 'email, name'
const fieldsToString = (fields: Record<string, unknown>) => {
  const output = []
  for (const [key, _value] of Object.entries(fields)) {
    output.push(key)
  }
  return output.join(', ')
}

const validationError = (
  type: string,
  name: string,
  options: any,
  substitutions = {}
) => {
  const errorClassName = `${pascalcase(
    type
  )}ValidationError` as keyof typeof ValidationErrors
  const ErrorClass = ValidationErrors[errorClassName]
  const errorMessage =
    typeof options === 'object' ? (options.message as string) : undefined

  throw new ErrorClass(name, errorMessage, substitutions)
}

// Main validation function, `directives` decides which actual validators
// above to use
//
// validate('firstName', 'Rob', { presence: true, length: { min: 2 } })
export const validate = (
  value: unknown,
  name: string,
  directives: ValidateDirectives
) => {
  for (const [validator, options] of Object.entries(directives)) {
    VALIDATORS[validator as keyof typeof VALIDATORS](value, name, options)
  }
}

// Run a custom validation function which should either throw or return nothing.
// Why not just write your own function? Because GraphQL will swallow it and
// just send "Something went wrong" back to the client. This captures any custom
// error you throw and turns it into a ServiceValidationError which will show
// the actual error message.
export const validateWith = (func: () => void) => {
  try {
    func()
  } catch (e) {
    const message = (e as Error).message || (e as string)
    throw new ValidationErrors.ServiceValidationError(message)
  }
}

// Wraps `callback` in a transaction to guarantee that `field` is not found in
// the database and that the `callback` is executed before someone else gets a
// chance to create the same value.
//
// In the case of updating an existing record, a uniqueness check will fail
// (because the existing record itself will be returned from the database). In
// this case you can provide a `$self` key with the `where` object to exclude
// the current record.
//
// There is an optional `$scope` key which contains additional the `where`
// clauses to include when checking whether the field is unique. So rather than
// a product name having to be unique across the entire database, you could
// check that it is only unique amoung a subset of records with the same
// `companyId`.
//
// As of Prisma v3.2.1 requires preview feature "interactiveTransactions" be
// enabled in prisma.schema:
//
//   previewFeatures = ["interactiveTransactions"]
//
// return validateUniqueness('user', { email: 'rob@redwoodjs.com' }, () => {
//   return db.create(data: { email })
// }, { message: '...'})
//
// return validateUniqueness('user', {
//   email: 'rob@redwoodjs.com',
//   $self: { id: 123 }
// }, () => {
//   return db.create(data: { email })
// }, { message: '...'})
//
// return validateUniqueness('user', {
//   email: 'rob@redwoodjs.com',
//   $scope: { companyId: input.companyId }
// }, () => {
//   return db.create(data: { email })
// }, { message: '...'})
export const validateUniqueness = async (
  model: string,
  fields: Record<string, unknown>,
  callback: (tx: PrismaClient) => Promise<any>,
  options: UniquenessValidatorOptions = {}
) => {
  const db = new PrismaClient()
  const { $self, $scope, ...rest } = fields

  const where: UniquenessWhere = {
    AND: [rest],
    NOT: [],
  }
  if ($scope) {
    where.AND.push($scope as Record<string, unknown>)
  }
  if ($self) {
    where.NOT.push($self as Record<string, unknown>)
  }

  return await db.$transaction(async (tx: PrismaClient) => {
    const found = await tx[model].findFirst({ where })

    if (found) {
      validationError('uniqueness', fieldsToString(fields), options)
    }

    return callback(tx)
  })
}
