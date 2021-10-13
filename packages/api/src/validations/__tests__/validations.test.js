import * as ValidationErrors from '../errors'
import { validate } from '../validations'

describe('validate', () => {})

describe('validate absence', () => {
  it('checks if value is null or undefined', () => {
    expect(() =>
      validate('email', 'rob@redwoodjs.com', { absence: true })
    ).toThrow(ValidationErrors.AbsenceValidationError)
    expect(() => validate('email', '', { absence: true })).toThrow(
      ValidationErrors.AbsenceValidationError
    )
    expect(() =>
      validate('email', '', { absence: { allowEmptyString: false } })
    ).toThrow(ValidationErrors.AbsenceValidationError)

    expect(() => validate('email', null, { absence: true })).not.toThrow()
    expect(() => validate('email', undefined, { absence: true })).not.toThrow()
    expect(() =>
      validate('email', '', { absence: { allowEmptyString: true } })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate('email', 'rob@redwoodjs.com', { absence: true })
    } catch (e) {
      expect(e.message).toEqual('email is not absent')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('email', 'rob@redwoodjs.com', {
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
      expect(() => validate('terms', val, { acceptance: true })).toThrow(
        ValidationErrors.AcceptanceValidationError
      )
    })
    expect(() =>
      validate('terms', 'true', { acceptance: { in: ['1'] } })
    ).toThrow(ValidationErrors.AcceptanceValidationError)
    expect(() => validate('terms', 1, { acceptance: { in: ['1'] } })).toThrow(
      ValidationErrors.AcceptanceValidationError
    )

    expect(() => validate('terms', true, { acceptance: true })).not.toThrow()
    expect(() =>
      validate('terms', 'true', { acceptance: { in: ['true'] } })
    ).not.toThrow()
    expect(() =>
      validate('terms', 1, { acceptance: { in: [1] } })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate('terms', false, { acceptance: true })
    } catch (e) {
      expect(e.message).toEqual('terms must be accepted')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('terms', false, { acceptance: { message: 'gotta accept' } })
    } catch (e) {
      expect(e.message).toEqual('gotta accept')
    }
  })
})

describe('validate exclusion', () => {
  it('checks for exclusion', () => {
    expect(() =>
      validate('selection', 'foo', { exclusion: ['foo', 'bar'] })
    ).toThrow(ValidationErrors.ExclusionValidationError)
    expect(() =>
      validate('selection', 'bar', { exclusion: { in: ['foo', 'bar'] } })
    ).toThrow(ValidationErrors.ExclusionValidationError)

    expect(() =>
      validate('selection', 'qux', { exclusion: ['foo', 'bar'] })
    ).not.toThrow()
    expect(() =>
      validate('selection', 'qux', { exclusion: { in: ['foo', 'bar'] } })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate('selection', 'foo', { exclusion: ['foo', 'bar'] })
    } catch (e) {
      expect(e.message).toEqual('selection is reserved')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('selection', 'foo', {
        exclusion: { in: ['foo', 'bar'], message: 'Bad choice' },
      })
    } catch (e) {
      expect(e.message).toEqual('Bad choice')
    }
  })
})

describe('validate format', () => {
  it('checks for valid format', () => {
    expect(() => validate('text', 'foobar', { format: /baz/ })).toThrow(
      ValidationErrors.FormatValidationError
    )
    expect(() => validate('text', 'foobar', { format: /baz/ })).toThrow(
      ValidationErrors.FormatValidationError
    )
    ;[(/foo/, /^foo/)].forEach((pattern) => {
      expect(() =>
        validate('text', 'foobar', { format: pattern })
      ).not.toThrow()
    })
    ;[(/foo/, /^foo/)].forEach((pattern) => {
      expect(() =>
        validate('text', 'foobar', { format: { pattern } })
      ).not.toThrow()
    })
  })

  it('throws with a default message', () => {
    try {
      validate('text', 'foobar', { format: /baz/ })
    } catch (e) {
      expect(e.message).toEqual('text is not formatted correctly')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('text', 'foobar', {
        format: { pattern: /baz/, message: 'bad format' },
      })
    } catch (e) {
      expect(e.message).toEqual('bad format')
    }
  })
})

describe('validate inclusion', () => {
  it('checks for inclusion', () => {
    expect(() =>
      validate('selection', 'qux', { inclusion: ['foo', 'bar'] })
    ).toThrow(ValidationErrors.InclusionValidationError)
    expect(() =>
      validate('selection', 'quux', { inclusion: { in: ['foo', 'bar'] } })
    ).toThrow(ValidationErrors.InclusionValidationError)

    expect(() =>
      validate('selection', 'foo', { inclusion: ['foo', 'bar'] })
    ).not.toThrow()
    expect(() =>
      validate('selection', 'foo', { inclusion: { in: ['foo', 'bar'] } })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate('selection', 'foo', { inclusion: ['foo', 'bar'] })
    } catch (e) {
      expect(e.message).toEqual('selection is not valid')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('selection', 'baz', {
        inclusion: { in: ['foo', 'bar'], message: 'Bad choice' },
      })
    } catch (e) {
      expect(e.message).toEqual('Bad choice')
    }
  })
})

describe('validate length', () => {
  it('checks for minimum length', () => {
    expect(() => validate('username', 'a', { length: { min: 2 } })).toThrow(
      ValidationErrors.MinLengthValidationError
    )

    // default error
    try {
      validate('username', 'a', { length: { min: 2 } })
    } catch (e) {
      expect(e.message).toEqual('username must have more than 2 characters')
    }

    // custom error
    try {
      validate('username', 'a', { length: { min: 2, message: 'too short' } })
    } catch (e) {
      expect(e.message).toEqual('too short')
    }

    // valid
    expect(() =>
      validate('username', 'foobar', { length: { min: 4 } })
    ).not.toThrow()
    expect(() =>
      validate('username', 'foobar', { length: { min: 4, max: 8 } })
    ).not.toThrow()
  })

  it('checks for maximum length', () => {
    expect(() =>
      validate('username', 'johndoeesquirethethird', { length: { max: 10 } })
    ).toThrow(ValidationErrors.MaxLengthValidationError)

    // default error
    try {
      validate('username', 'jeff', { length: { max: 2 } })
    } catch (e) {
      expect(e.message).toEqual('username must have less than 2 characters')
    }

    // custom error
    try {
      validate('username', 'jill', { length: { max: 2, message: 'too long' } })
    } catch (e) {
      expect(e.message).toEqual('too long')
    }

    // valid
    expect(() =>
      validate('username', 'foobar', { length: { max: 8 } })
    ).not.toThrow()
  })

  it('throws an error if the field does not equal a given number', () => {
    // too short
    expect(() =>
      validate('username', 'foobar', { length: { equal: 7 } })
    ).toThrow(ValidationErrors.EqualLengthValidationError)

    // too long
    expect(() =>
      validate('username', 'foobarbaz', { length: { equal: 7 } })
    ).toThrow(ValidationErrors.EqualLengthValidationError)

    // default error
    try {
      validate('username', 'foobar', { length: { equal: 5 } })
    } catch (e) {
      expect(e.message).toEqual('username does not have exactly 5 characters')
    }

    // custom error
    try {
      validate('username', 'foobar', {
        length: { equal: 5, message: 'wrong length' },
      })
    } catch (e) {
      expect(e.message).toEqual('wrong length')
    }

    // valid
    expect(() =>
      validate('username', 'foobar', { length: { equal: 6 } })
    ).not.toThrow()
  })

  it('throws an error if the field is not within a range', () => {
    // too short
    expect(() =>
      validate('username', 'foobar', { length: { between: [10, 20] } })
    ).toThrow(ValidationErrors.BetweenLengthValidationError)

    // too long
    expect(() =>
      validate('username', 'foobar', { length: { between: [2, 4] } })
    ).toThrow(ValidationErrors.BetweenLengthValidationError)

    // default error
    try {
      validate('username', 'foobar', { length: { between: [2, 4] } })
    } catch (e) {
      expect(e.message).toEqual('username must be between 2 and 4 characters')
    }

    // custom error
    try {
      validate('username', 'foobar', {
        length: { between: [2, 4], message: 'not enough or too many' },
      })
    } catch (e) {
      expect(e.message).toEqual('not enough or too many')
    }

    // valid
    expect(() =>
      validate('username', 'foobar', { length: { between: [2, 10] } })
    ).not.toThrow()
  })
})

describe('validate numericality', () => {
  it('checks if value is an integer', () => {
    expect(() =>
      validate('number', 'a', { numericality: { integer: true } })
    ).toThrow(ValidationErrors.IntegerNumericalityValidationError)
    expect(() =>
      validate('number', 1.2, { numericality: { integer: true } })
    ).toThrow(ValidationErrors.IntegerNumericalityValidationError)

    expect(() =>
      validate('number', 3, { numericality: { integer: true } })
    ).not.toThrow(ValidationErrors.IntegerNumericalityValidationError)
  })

  it('checks if value is less than required number', () => {
    expect(() =>
      validate('number', 2, { numericality: { lessThan: 1 } })
    ).toThrow(ValidationErrors.LessThanNumericalityValidationError)
    expect(() =>
      validate('number', 2, { numericality: { lessThan: 2 } })
    ).toThrow(ValidationErrors.LessThanNumericalityValidationError)
    expect(() =>
      validate('number', 2.1, { numericality: { lessThan: 2.1 } })
    ).toThrow(ValidationErrors.LessThanNumericalityValidationError)
    expect(() =>
      validate('number', 2.2, { numericality: { lessThan: 2.1 } })
    ).toThrow(ValidationErrors.LessThanNumericalityValidationError)

    expect(() =>
      validate('number', 2, { numericality: { lessThan: 3 } })
    ).not.toThrow(ValidationErrors.LessThanNumericalityValidationError)
    expect(() =>
      validate('number', 3.1, { numericality: { lessThan: 3.2 } })
    ).not.toThrow(ValidationErrors.LessThanNumericalityValidationError)
  })

  it('checks if value is less than or equal to required number', () => {
    expect(() =>
      validate('number', 2, { numericality: { lessThanOrEqual: 1 } })
    ).toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
    expect(() =>
      validate('number', 2, { numericality: { lessThanOrEqual: 1.5 } })
    ).toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
    expect(() =>
      validate('number', 2.2, { numericality: { lessThanOrEqual: 2.1 } })
    ).toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
    expect(() =>
      validate('number', 2.2, { numericality: { lessThanOrEqual: 2 } })
    ).toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)

    expect(() =>
      validate('number', 2.2, { numericality: { lessThanOrEqual: 2.3 } })
    ).not.toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
    expect(() =>
      validate('number', 2.2, { numericality: { lessThanOrEqual: 2.2 } })
    ).not.toThrow(ValidationErrors.LessThanOrEqualNumericalityValidationError)
  })

  it('checks if value is greater than required number', () => {
    expect(() =>
      validate('number', 2, { numericality: { greaterThan: 3 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate('number', 2, { numericality: { greaterThan: 2 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate('number', 2.1, { numericality: { greaterThan: 3 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate('number', 3.0, { numericality: { greaterThan: 3.1 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate('number', 3.0, { numericality: { greaterThan: 3 } })
    ).toThrow(ValidationErrors.GreaterThanNumericalityValidationError)

    expect(() =>
      validate('number', 3, { numericality: { greaterThan: 2 } })
    ).not.toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate('number', 3.1, { numericality: { greaterThan: 3.0 } })
    ).not.toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
  })

  it('checks if value is greater than or equal to required number', () => {
    expect(() =>
      validate('number', 2, { numericality: { greaterThanOrEqual: 3 } })
    ).toThrow(ValidationErrors.GreaterThanOrEqualNumericalityValidationError)
    expect(() =>
      validate('number', 3.0, { numericality: { greaterThanOrEqual: 3.1 } })
    ).toThrow(ValidationErrors.GreaterThanOrEqualNumericalityValidationError)

    expect(() =>
      validate('number', 3, { numericality: { greaterThan: 2 } })
    ).not.toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate('number', 3.1, { numericality: { greaterThan: 3.0 } })
    ).not.toThrow(ValidationErrors.GreaterThanNumericalityValidationError)
    expect(() =>
      validate('number', 2, { numericality: { greaterThanOrEqual: 2 } })
    ).not.toThrow(
      ValidationErrors.GreaterThanOrEqualNumericalityValidationError
    )
    expect(() =>
      validate('number', 2.5, { numericality: { greaterThanOrEqual: 2.5 } })
    ).not.toThrow(
      ValidationErrors.GreaterThanOrEqualNumericalityValidationError
    )
  })

  it('checks if value is not equal to required number', () => {
    expect(() => validate('number', 2, { numericality: { equal: 3 } })).toThrow(
      ValidationErrors.EqualNumericalityValidationError
    )
    expect(() =>
      validate('number', 2.0, { numericality: { equal: 3 } })
    ).toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate('number', 2.9, { numericality: { equal: 3.1 } })
    ).toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate('number', 2.9, { numericality: { equal: 3 } })
    ).toThrow(ValidationErrors.EqualNumericalityValidationError)

    expect(() =>
      validate('number', 2, { numericality: { equal: 2 } })
    ).not.toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate('number', 2.0, { numericality: { equal: 2.0 } })
    ).not.toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate('number', 2, { numericality: { equal: 2.0 } })
    ).not.toThrow(ValidationErrors.EqualNumericalityValidationError)
    expect(() =>
      validate('number', 2.0, { numericality: { equal: 2 } })
    ).not.toThrow(ValidationErrors.EqualNumericalityValidationError)
  })

  it('checks if not equal to required number', () => {
    expect(() =>
      validate('number', 3, { numericality: { otherThan: 3 } })
    ).toThrow(ValidationErrors.OtherThanNumericalityValidationError)
    expect(() =>
      validate('number', 2.9, { numericality: { otherThan: 2.9 } })
    ).toThrow(ValidationErrors.OtherThanNumericalityValidationError)
    expect(() =>
      validate('number', 3.0, { numericality: { otherThan: 3 } })
    ).toThrow(ValidationErrors.OtherThanNumericalityValidationError)

    expect(() =>
      validate('number', 2, { numericality: { otherThan: 3 } })
    ).not.toThrow(ValidationErrors.OtherThanNumericalityValidationError)
    expect(() =>
      validate('number', 2.1, { numericality: { otherThan: 3.1 } })
    ).not.toThrow(ValidationErrors.OtherThanNumericalityValidationError)
    expect(() =>
      validate('number', 3.0, { numericality: { otherThan: 4 } })
    ).not.toThrow(ValidationErrors.OtherThanNumericalityValidationError)
  })

  it('checks for a value being even', () => {
    expect(() =>
      validate('number', 3, { numericality: { even: true } })
    ).toThrow(ValidationErrors.EvenNumericalityValidationError)
    expect(() =>
      validate('number', 3.0, { numericality: { even: true } })
    ).toThrow(ValidationErrors.EvenNumericalityValidationError)

    expect(() =>
      validate('number', 2, { numericality: { even: true } })
    ).not.toThrow(ValidationErrors.EvenNumericalityValidationError)
    expect(() =>
      validate('number', 2.0, { numericality: { even: true } })
    ).not.toThrow(ValidationErrors.EvenNumericalityValidationError)
  })

  it('checks for a value being odd', () => {
    expect(() =>
      validate('number', 2, { numericality: { odd: true } })
    ).toThrow(ValidationErrors.OddNumericalityValidationError)
    expect(() =>
      validate('number', 2.0, { numericality: { odd: true } })
    ).toThrow(ValidationErrors.OddNumericalityValidationError)

    expect(() =>
      validate('number', 3, { numericality: { odd: true } })
    ).not.toThrow(ValidationErrors.OddNumericalityValidationError)
    expect(() =>
      validate('number', 3.0, { numericality: { odd: true } })
    ).not.toThrow(ValidationErrors.OddNumericalityValidationError)
  })

  it('throws with a default message', () => {
    try {
      validate('number', 3, { numericality: { even: true } })
    } catch (e) {
      expect(e.message).toEqual('number must be even')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('number', 3, {
        numericality: { even: true, message: 'No odd numbers' },
      })
    } catch (e) {
      expect(e.message).toEqual('No odd numbers')
    }
  })
})

describe('validate presence', () => {
  it('checks for a field being null', () => {
    expect(() => validate('email', null, { presence: true })).toThrow(
      ValidationErrors.PresenceValidationError
    )
    expect(() =>
      validate('email', null, { presence: { allowNull: false } })
    ).toThrow(ValidationErrors.PresenceValidationError)

    expect(() =>
      validate('email', undefined, { presence: { allowUndefined: true } })
    ).not.toThrow()
    expect(() =>
      validate('email', null, { presence: { allowNull: true } })
    ).not.toThrow()
    expect(() => validate('email', '', { presence: true })).not.toThrow()
  })

  it('checks for a field being undefined', () => {
    expect(() => validate('email', undefined, { presence: true })).toThrow(
      ValidationErrors.PresenceValidationError
    )
    expect(() =>
      validate('email', undefined, { presence: { allowUndefined: false } })
    ).toThrow(ValidationErrors.PresenceValidationError)

    expect(() =>
      validate('email', null, { presence: { allowNull: true } })
    ).not.toThrow()
    expect(() =>
      validate('email', undefined, { presence: { allowUndefined: true } })
    ).not.toThrow()
  })

  it('checks for a field being an empty string', () => {
    expect(() =>
      validate('email', '', { presence: { allowEmptyString: false } })
    ).toThrow(ValidationErrors.PresenceValidationError)

    expect(() => validate('email', '', { presence: true })).not.toThrow()
    expect(() =>
      validate('email', '', {
        presence: { allowNull: true, allowUndefined: true },
      })
    ).not.toThrow()
  })

  it('throws with a default message', () => {
    try {
      validate('email', undefined, { presence: true })
    } catch (e) {
      expect(e.message).toEqual('email is not present')
    }
  })

  it('throws with a custom message', () => {
    try {
      validate('email', undefined, { presence: { message: 'Gimmie an email' } })
    } catch (e) {
      expect(e.message).toEqual('Gimmie an email')
    }
  })
})

describe('validate', () => {
  it('chains multiple validators', () => {
    // fails first validator
    expect(() =>
      validate('email', null, {
        presence: true,
        format: /^\d+$/,
      })
    ).toThrow(ValidationErrors.PresenceValidationError)

    // fails second validator
    expect(() =>
      validate('email', 'rob@redwoodjs.com', {
        presence: true,
        format: /^\d+$/,
      })
    ).toThrow(ValidationErrors.FormatValidationError)

    // passes all validators
    expect(() =>
      validate('number', 12345, {
        presence: true,
        format: /^\d+$/,
      })
    ).not.toThrow()
  })
})
