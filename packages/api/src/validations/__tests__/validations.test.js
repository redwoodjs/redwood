import * as ValidationErrors from '../errors'
import { validate, validateUniqueness, validateWith } from '../validations'

describe('validate absence', () => {
  it('checks if value is null or undefined', () => {
    expect(() =>
      validate('rob@redwoodjs.com', 'email', { absence: true })
    ).toThrow(ValidationErrors.AbsenceValidationError)
    expect(() => validate('', 'email', { absence: true })).toThrow(
      ValidationErrors.AbsenceValidationError
    )
    expect(() =>
      validate('', 'email', { absence: { allowEmptyString: false } })
    ).toThrow(ValidationErrors.AbsenceValidationError)

    expect(() => validate(null, 'email', { absence: true })).not.toThrow()
    expect(() => validate(undefined, 'email', { absence: true })).not.toThrow()
    expect(() =>
      validate('', 'email', { absence: { allowEmptyString: true } })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate('rob@redwoodjs.com', 'email', { absence: true })
    } catch (e) {
      expect(e.message).toEqual('email is not absent')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('rob@redwoodjs.com', 'email', {
        absence: { message: 'No email please' },
      })
    } catch (e) {
      expect(e.message).toEqual('No email please')
    }
  })
})

describe('validate acceptance', () => {
  it('checks for truthiness', () => {
    ;[null, undefined, 0, 1, '1', 'true'].forEach((val) => {
      expect(() => validate(val, 'terms', { acceptance: true })).toThrow(
        ValidationErrors.AcceptanceValidationError
      )
    })
    expect(() =>
      validate('terms', 'true', { acceptance: { in: ['1'] } })
    ).toThrow(ValidationErrors.AcceptanceValidationError)
    expect(() => validate(1, 'terms', { acceptance: { in: ['1'] } })).toThrow(
      ValidationErrors.AcceptanceValidationError
    )

    expect(() => validate(true, 'terms', { acceptance: true })).not.toThrow()
    expect(() =>
      validate('true', 'terms', { acceptance: { in: ['true'] } })
    ).not.toThrow()
    expect(() =>
      validate(1, 'terms', { acceptance: { in: [1] } })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate(false, 'Terms', { acceptance: true })
    } catch (e) {
      expect(e.message).toEqual('Terms must be accepted')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate(false, 'terms', { acceptance: { message: 'gotta accept' } })
    } catch (e) {
      expect(e.message).toEqual('gotta accept')
    }
  })
})

describe('validate exclusion', () => {
  it('checks for exclusion', () => {
    expect(() =>
      validate('foo', 'selection', { exclusion: ['foo', 'bar'] })
    ).toThrow(ValidationErrors.ExclusionValidationError)
    expect(() =>
      validate('bar', 'selection', { exclusion: { in: ['foo', 'bar'] } })
    ).toThrow(ValidationErrors.ExclusionValidationError)

    expect(() =>
      validate('qux', 'selection', { exclusion: ['foo', 'bar'] })
    ).not.toThrow()
    expect(() =>
      validate('qux', 'selection', { exclusion: { in: ['foo', 'bar'] } })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate('foo', 'selection', { exclusion: ['foo', 'bar'] })
    } catch (e) {
      expect(e.message).toEqual('selection is reserved')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('foo', 'selection', {
        exclusion: { in: ['foo', 'bar'], message: 'Bad choice' },
      })
    } catch (e) {
      expect(e.message).toEqual('Bad choice')
    }
  })
})

describe('validate format', () => {
  it('checks for valid format', () => {
    expect(() => validate('foobar', 'text', { format: /baz/ })).toThrow(
      ValidationErrors.FormatValidationError
    )
    expect(() => validate('foobar', 'text', { format: /baz/ })).toThrow(
      ValidationErrors.FormatValidationError
    )
    // inline regex
    ;[(/foo/, /^foo/)].forEach((pattern) => {
      expect(() =>
        validate('foobar', 'text', { format: pattern })
      ).not.toThrow()
    })
    // options format
    ;[(/foo/, /^foo/)].forEach((pattern) => {
      expect(() =>
        validate('foobar', 'text', { format: { pattern } })
      ).not.toThrow()
    })
  })

  it('throws if no pattern given', () => {
    try {
      validate('foobar', 'text', { format: { pattern: null } })
    } catch (e) {
      expect(e.message).toEqual('No pattern for format validation')
    }
    try {
      validate('foobar', 'text', { format: { pattern: undefined } })
    } catch (e) {
      expect(e.message).toEqual('No pattern for format validation')
    }
    try {
      validate('foobar', 'text', { format: { message: 'no pattern' } })
    } catch (e) {
      expect(e.message).toEqual('No pattern for format validation')
    }
    expect.assertions(3)
  })

  it('throws with a default message', () => {
    try {
      validate('foobar', 'text', { format: /baz/ })
    } catch (e) {
      expect(e.message).toEqual('text is not formatted correctly')
    }
    expect.assertions(1)
  })

  it('throws with a custom message', () => {
    try {
      validate('foobar', 'text', {
        format: { pattern: /baz/, message: 'bad format' },
      })
    } catch (e) {
      expect(e.message).toEqual('bad format')
    }
    expect.assertions(1)
  })
})

describe('validate inclusion', () => {
  it('checks for inclusion', () => {
    expect(() =>
      validate('qux', 'selection', { inclusion: ['foo', 'bar'] })
    ).toThrow(ValidationErrors.InclusionValidationError)
    expect(() =>
      validate('quux', 'selection', { inclusion: { in: ['foo', 'bar'] } })
    ).toThrow(ValidationErrors.InclusionValidationError)

    expect(() =>
      validate('foo', 'selection', { inclusion: ['foo', 'bar'] })
    ).not.toThrow()
    expect(() =>
      validate('foo', 'selection', { inclusion: { in: ['foo', 'bar'] } })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate('foo', 'selection', { inclusion: ['foo', 'bar'] })
    } catch (e) {
      expect(e.message).toEqual('selection is not valid')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('baz', 'selection', {
        inclusion: { in: ['foo', 'bar'], message: 'Bad choice' },
      })
    } catch (e) {
      expect(e.message).toEqual('Bad choice')
    }
  })
})

describe('validate length', () => {
  it('checks for minimum length', () => {
    expect(() => validate('a', 'username', { length: { min: 2 } })).toThrow(
      ValidationErrors.MinLengthValidationError
    )

    // default error
    try {
      validate('a', 'username', { length: { min: 2 } })
    } catch (e) {
      expect(e.message).toEqual('username must have more than 2 characters')
    }

    // custom error
    try {
      validate('a', 'username', { length: { min: 2, message: 'too short' } })
    } catch (e) {
      expect(e.message).toEqual('too short')
    }

    // valid
    expect(() =>
      validate('foobar', 'username', { length: { min: 4 } })
    ).not.toThrow()
    expect(() =>
      validate('foobar', 'username', { length: { min: 4, max: 8 } })
    ).not.toThrow()
  })

  it('checks for maximum length', () => {
    expect(() =>
      validate('johndoeesquirethethird', 'username', { length: { max: 10 } })
    ).toThrow(ValidationErrors.MaxLengthValidationError)

    // default error
    try {
      validate('jeff', 'Username', { length: { max: 2 } })
    } catch (e) {
      expect(e.message).toEqual('Username must have less than 2 characters')
    }

    // custom error
    try {
      validate('jill', 'username', { length: { max: 2, message: 'too long' } })
    } catch (e) {
      expect(e.message).toEqual('too long')
    }

    // valid
    expect(() =>
      validate('foobar', 'username', { length: { max: 8 } })
    ).not.toThrow()
  })

  it('throws an error if the field does not equal a given number', () => {
    // too short
    expect(() =>
      validate('foobar', 'username', { length: { equal: 7 } })
    ).toThrow(ValidationErrors.EqualLengthValidationError)

    // too long
    expect(() =>
      validate('foobarbaz', 'username', { length: { equal: 7 } })
    ).toThrow(ValidationErrors.EqualLengthValidationError)

    // default error
    try {
      validate('foobar', 'username', { length: { equal: 5 } })
    } catch (e) {
      expect(e.message).toEqual('username must have exactly 5 characters')
    }

    // custom error
    try {
      validate('foobar', 'username', {
        length: { equal: 5, message: 'wrong length' },
      })
    } catch (e) {
      expect(e.message).toEqual('wrong length')
    }

    // valid
    expect(() =>
      validate('foobar', 'username', { length: { equal: 6 } })
    ).not.toThrow()
  })

  it('throws an error if the field is not within a range', () => {
    // too short
    expect(() =>
      validate('foobar', 'username', { length: { between: [10, 20] } })
    ).toThrow(ValidationErrors.BetweenLengthValidationError)

    // too long
    expect(() =>
      validate('foobar', 'username', { length: { between: [2, 4] } })
    ).toThrow(ValidationErrors.BetweenLengthValidationError)

    // default error
    try {
      validate('foobar', 'username', { length: { between: [2, 4] } })
    } catch (e) {
      expect(e.message).toEqual('username must be between 2 and 4 characters')
    }

    // custom error
    try {
      validate('foobar', 'username', {
        length: { between: [2, 4], message: 'not enough or too many' },
      })
    } catch (e) {
      expect(e.message).toEqual('not enough or too many')
    }

    // valid
    expect(() =>
      validate('foobar', 'username', { length: { between: [2, 10] } })
    ).not.toThrow()
  })
})

describe('validate numericality', () => {
  it('checks if value is a number', () => {
    expect(() => validate('a', 'number', { numericality: true })).toThrow(
      ValidationErrors.TypeNumericalityValidationError
    )
    expect(() => validate([1], 'number', { numericality: true })).toThrow(
      ValidationErrors.TypeNumericalityValidationError
    )
    expect(() =>
      validate({ foo: 1 }, 'number', { numericality: true })
    ).toThrow(ValidationErrors.TypeNumericalityValidationError)

    expect(() => validate(42, 'number', { numericality: true })).not.toThrow()
    expect(() => validate(42.5, 'number', { numericality: true })).not.toThrow()
  })

  it('checks if value is an integer', () => {
    expect(() =>
      validate(1.2, 'number', { numericality: { integer: true } })
    ).toThrow(ValidationErrors.IntegerNumericalityValidationError)

    expect(() =>
      validate(3, 'number', { numericality: { integer: true } })
    ).not.toThrow(ValidationErrors.IntegerNumericalityValidationError)
  })

  it('checks if value is less than required number', () => {
    expect(() =>
      validate(2, 'number', { numericality: { lessThan: 1 } })
    ).toThrow(ValidationErrors.LessThanNumericalityValidationError)
    expect(() =>
      validate(2, 'number', { numericality: { lessThan: 2 } })
    ).toThrow(ValidationErrors.LessThanNumericalityValidationError)
    expect(() =>
      validate(2.1, 'number', { numericality: { lessThan: 2.1 } })
    ).toThrow(ValidationErrors.LessThanNumericalityValidationError)
    expect(() =>
      validate(2.2, 'number', { numericality: { lessThan: 2.1 } })
    ).toThrow(ValidationErrors.LessThanNumericalityValidationError)

    expect(() =>
      validate(2, 'number', { numericality: { lessThan: 3 } })
    ).not.toThrow(ValidationErrors.LessThanNumericalityValidationError)
    expect(() =>
      validate(3.1, 'number', { numericality: { lessThan: 3.2 } })
    ).not.toThrow(ValidationErrors.LessThanNumericalityValidationError)
  })

  it('checks if value is less than or equal to required number', () => {
    expect(() =>
      validate(2, 'number', { numericality: { lessThanOrEqual: 1 } })
    ).toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
    expect(() =>
      validate(2, 'number', { numericality: { lessThanOrEqual: 1.5 } })
    ).toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
    expect(() =>
      validate(2.2, 'number', { numericality: { lessThanOrEqual: 2.1 } })
    ).toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
    expect(() =>
      validate(2.2, 'number', { numericality: { lessThanOrEqual: 2 } })
    ).toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)

    expect(() =>
      validate(2.2, 'number', { numericality: { lessThanOrEqual: 2.3 } })
    ).not.toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
    expect(() =>
      validate(2.2, 'number', { numericality: { lessThanOrEqual: 2.2 } })
    ).not.toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
  })

  it('checks if value is greater than required number', () => {
    expect(() =>
      validate(2, 'number', { numericality: { greaterThan: 3 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate(2, 'number', { numericality: { greaterThan: 2 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate(2.1, 'number', { numericality: { greaterThan: 3 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate(3.0, 'number', { numericality: { greaterThan: 3.1 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate(3.0, 'number', { numericality: { greaterThan: 3 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)

    expect(() =>
      validate(3, 'number', { numericality: { greaterThan: 2 } })
    ).not.toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate(3.1, 'number', { numericality: { greaterThan: 3.0 } })
    ).not.toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
  })

  it('checks if value is greater than or equal to required number', () => {
    expect(() =>
      validate(2, 'number', { numericality: { greaterThanOrEqual: 3 } })
    ).toThrow(ValidationErrors.GreaterThanOrEqualNumericalityValidationError)
    expect(() =>
      validate(3.0, 'number', { numericality: { greaterThanOrEqual: 3.1 } })
    ).toThrow(ValidationErrors.GreaterThanOrEqualNumericalityValidationError)

    expect(() =>
      validate(3, 'number', { numericality: { greaterThan: 2 } })
    ).not.toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate(3.1, 'number', { numericality: { greaterThan: 3.0 } })
    ).not.toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate(2, 'number', { numericality: { greaterThanOrEqual: 2 } })
    ).not.toThrow(
      ValidationErrors.GreaterThanOrEqualNumericalityValidationError
    )
    expect(() =>
      validate(2.5, 'number', { numericality: { greaterThanOrEqual: 2.5 } })
    ).not.toThrow(
      ValidationErrors.GreaterThanOrEqualNumericalityValidationError
    )
  })

  it('checks if value is not equal to required number', () => {
    expect(() => validate(2, 'number', { numericality: { equal: 3 } })).toThrow(
      ValidationErrors.EqualNumericalityValidationError
    )
    expect(() =>
      validate(2.0, 'number', { numericality: { equal: 3 } })
    ).toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate(2.9, 'number', { numericality: { equal: 3.1 } })
    ).toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate(2.9, 'number', { numericality: { equal: 3 } })
    ).toThrow(ValidationErrors.EqualNumericalityValidationError)

    expect(() =>
      validate(2, 'number', { numericality: { equal: 2 } })
    ).not.toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate(2.0, 'number', { numericality: { equal: 2.0 } })
    ).not.toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate(2, 'number', { numericality: { equal: 2.0 } })
    ).not.toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate(2.0, 'number', { numericality: { equal: 2 } })
    ).not.toThrow(ValidationErrors.EqualNumericalityValidationError)
  })

  it('checks if not equal to required number', () => {
    expect(() =>
      validate(3, 'number', { numericality: { otherThan: 3 } })
    ).toThrow(ValidationErrors.OtherThanNumericalityValidationError)
    expect(() =>
      validate(2.9, 'number', { numericality: { otherThan: 2.9 } })
    ).toThrow(ValidationErrors.OtherThanNumericalityValidationError)
    expect(() =>
      validate(3.0, 'number', { numericality: { otherThan: 3 } })
    ).toThrow(ValidationErrors.OtherThanNumericalityValidationError)

    expect(() =>
      validate(2, 'number', { numericality: { otherThan: 3 } })
    ).not.toThrow(ValidationErrors.OtherThanNumericalityValidationError)
    expect(() =>
      validate(2.1, 'number', { numericality: { otherThan: 3.1 } })
    ).not.toThrow(ValidationErrors.OtherThanNumericalityValidationError)
    expect(() =>
      validate(3.0, 'number', { numericality: { otherThan: 4 } })
    ).not.toThrow(ValidationErrors.OtherThanNumericalityValidationError)
  })

  it('checks for a value being even', () => {
    expect(() =>
      validate(3, 'number', { numericality: { even: true } })
    ).toThrow(ValidationErrors.EvenNumericalityValidationError)
    expect(() =>
      validate(3.0, 'number', { numericality: { even: true } })
    ).toThrow(ValidationErrors.EvenNumericalityValidationError)

    expect(() =>
      validate(2, 'number', { numericality: { even: true } })
    ).not.toThrow(ValidationErrors.EvenNumericalityValidationError)
    expect(() =>
      validate(2.0, 'number', { numericality: { even: true } })
    ).not.toThrow(ValidationErrors.EvenNumericalityValidationError)
  })

  it('checks for a value being odd', () => {
    expect(() =>
      validate(2, 'number', { numericality: { odd: true } })
    ).toThrow(ValidationErrors.OddNumericalityValidationError)
    expect(() =>
      validate(2.0, 'number', { numericality: { odd: true } })
    ).toThrow(ValidationErrors.OddNumericalityValidationError)

    expect(() =>
      validate(3, 'number', { numericality: { odd: true } })
    ).not.toThrow(ValidationErrors.OddNumericalityValidationError)
    expect(() =>
      validate(3.0, 'number', { numericality: { odd: true } })
    ).not.toThrow(ValidationErrors.OddNumericalityValidationError)
  })

  it('checks for a value being positive', () => {
    expect(() =>
      validate(-1, 'number', { numericality: { positive: true } })
    ).toThrow(ValidationErrors.PositiveNumericalityValidationError)
    expect(() =>
      validate(-2.0, 'number', { numericality: { positive: true } })
    ).toThrow(ValidationErrors.PositiveNumericalityValidationError)
    expect(() =>
      validate(0, 'number', { numericality: { positive: true } })
    ).toThrow(ValidationErrors.PositiveNumericalityValidationError)

    expect(() =>
      validate(3, 'number', { numericality: { positive: true } })
    ).not.toThrow(ValidationErrors.PositiveNumericalityValidationError)
    expect(() =>
      validate(3.0, 'number', { numericality: { positive: true } })
    ).not.toThrow(ValidationErrors.PositiveNumericalityValidationError)
  })

  it('checks for a value being negative', () => {
    expect(() =>
      validate(1, 'number', { numericality: { negative: true } })
    ).toThrow(ValidationErrors.NegativeNumericalityValidationError)
    expect(() =>
      validate(2.0, 'number', { numericality: { negative: true } })
    ).toThrow(ValidationErrors.NegativeNumericalityValidationError)
    expect(() =>
      validate(0, 'number', { numericality: { negative: true } })
    ).toThrow(ValidationErrors.NegativeNumericalityValidationError)

    expect(() =>
      validate(-3, 'number', { numericality: { negative: true } })
    ).not.toThrow(ValidationErrors.NegativeNumericalityValidationError)
    expect(() =>
      validate(-3.0, 'number', { numericality: { negative: true } })
    ).not.toThrow(ValidationErrors.NegativeNumericalityValidationError)
  })

  it('throws with a default message', () => {
    try {
      validate(3, 'number', { numericality: { even: true } })
    } catch (e) {
      expect(e.message).toEqual('number must be even')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate(3, 'number', {
        numericality: { even: true, message: 'No odd numbers' },
      })
    } catch (e) {
      expect(e.message).toEqual('No odd numbers')
    }
  })
})

describe('validate presence', () => {
  it('checks for a field being null', () => {
    expect(() => validate(null, 'email', { presence: true })).toThrow(
      ValidationErrors.PresenceValidationError
    )
    expect(() =>
      validate(null, 'email', { presence: { allowNull: false } })
    ).toThrow(ValidationErrors.PresenceValidationError)

    expect(() =>
      validate(undefined, 'email', { presence: { allowUndefined: true } })
    ).not.toThrow()
    expect(() =>
      validate(null, 'email', { presence: { allowNull: true } })
    ).not.toThrow()
    expect(() => validate('', 'email', { presence: true })).not.toThrow()
  })

  it('checks for a field being undefined', () => {
    expect(() => validate(undefined, 'email', { presence: true })).toThrow(
      ValidationErrors.PresenceValidationError
    )
    expect(() =>
      validate(undefined, 'email', { presence: { allowUndefined: false } })
    ).toThrow(ValidationErrors.PresenceValidationError)

    expect(() =>
      validate(null, 'email', { presence: { allowNull: true } })
    ).not.toThrow()
    expect(() =>
      validate(undefined, 'email', { presence: { allowUndefined: true } })
    ).not.toThrow()
  })

  it('checks for a field being an empty string', () => {
    expect(() =>
      validate('', 'email', { presence: { allowEmptyString: false } })
    ).toThrow(ValidationErrors.PresenceValidationError)

    expect(() => validate('', 'email', { presence: true })).not.toThrow()
    expect(() =>
      validate('', 'email', {
        presence: { allowNull: true, allowUndefined: true },
      })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate(undefined, 'email', { presence: true })
    } catch (e) {
      expect(e.message).toEqual('email must be present')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate(undefined, 'email', { presence: { message: 'Gimmie an email' } })
    } catch (e) {
      expect(e.message).toEqual('Gimmie an email')
    }
  })
})

describe('validate', () => {
  it('chains multiple validators', () => {
    // fails first validator
    expect(() =>
      validate(null, 'email', {
        presence: true,
        format: /^\d+$/,
      })
    ).toThrow(ValidationErrors.PresenceValidationError)

    // fails second validator
    expect(() =>
      validate('rob@redwoodjs.com', 'email', {
        presence: true,
        format: /^\d+$/,
      })
    ).toThrow(ValidationErrors.FormatValidationError)

    // passes all validators
    expect(() =>
      validate(12345, 'number', {
        presence: true,
        format: /^\d+$/,
      })
    ).not.toThrow()
  })
})

describe('validateWith', () => {
  it('runs a custom function as a validation', () => {
    const validateFunction = jest.fn()
    validateWith(validateFunction)

    expect(validateFunction).toBeCalledWith()
  })

  it('catches errors and raises ServiceValidationError', () => {
    // Error instance
    try {
      validateWith(() => {
        throw new Error('Invalid value')
      })
    } catch (e) {
      expect(e instanceof ValidationErrors.ServiceValidationError).toEqual(true)
      expect(e.message).toEqual('Invalid value')
    }

    // Error string
    try {
      validateWith(() => {
        throw 'Bad input'
      })
    } catch (e) {
      expect(e instanceof ValidationErrors.ServiceValidationError).toEqual(true)
      expect(e.message).toEqual('Bad input')
    }

    expect.assertions(4)
  })
})

// Mock just enough of PrismaClient that we can test a transaction is running.
// Prisma.PrismaClient is a class so we need to return a function that returns
// the actual methods of an instance of the class
//
// mockFindFirst.mockImplementation() to change what `findFirst()` would return
const mockFindFirst = jest.fn()
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $transaction: async (func) =>
      func({
        user: {
          findFirst: mockFindFirst,
        },
      }),
  })),
}))

describe('validateUniqueness', () => {
  beforeEach(() => {
    mockFindFirst.mockClear()
  })

  it('throws an error if record is not unique', async () => {
    mockFindFirst.mockImplementation(() => ({
      id: 1,
      email: 'rob@redwoodjs.com',
    }))

    try {
      await validateUniqueness('user', { email: 'rob@redwoodjs.com' }, () => {})
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationErrors.UniquenessValidationError)
    }
    expect.assertions(1)
  })

  it('calls callback if record is unique', async () => {
    mockFindFirst.mockImplementation(() => null)

    await validateUniqueness('user', { email: 'rob@redwoodjs.com' }, () => {
      expect(true).toEqual(true)
    })

    expect.assertions(1)
  })

  it('throws with a default error message', async () => {
    mockFindFirst.mockImplementation(() => ({
      id: 2,
      email: 'rob@redwoodjs.com',
    }))

    // single field
    try {
      await validateUniqueness('user', { email: 'rob@redwoodjs.com' }, () => {})
    } catch (e) {
      expect(e.message).toEqual('email must be unique')
    }

    // multiple fields
    try {
      await validateUniqueness(
        'user',
        { name: 'Rob', email: 'rob@redwoodjs.com' },
        () => {}
      )
    } catch (e) {
      expect(e.message).toEqual('name, email must be unique')
    }
    expect.assertions(2)
  })

  it('throws with a custom error message', async () => {
    mockFindFirst.mockImplementation(() => ({
      id: 3,
      email: 'rob@redwoodjs.com',
    }))

    try {
      await validateUniqueness(
        'user',
        { email: 'rob@redwoodjs.com' },
        () => {},
        {
          message: 'Email already taken',
        }
      )
    } catch (e) {
      expect(e.message).toEqual('Email already taken')
    }
    expect.assertions(1)
  })
})
