import * as ValidationErrors from '../errors'
import { validate } from '../validations'

describe('validate', () => {})

describe('validate absence', () => {
  it('throws an error if the field is not null', () => {
    expect(() =>
      validate('email', 'rob@redwoodjs.com', { absence: true })
    ).toThrow(ValidationErrors.AbsenceValidationError)
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

  it('does not throw an error field is null', () => {
    expect(() => validate('email', null, { absence: true })).not.toThrow()
  })

  it('does not throw an error field is undefined', () => {
    expect(() => validate('email', undefined, { absence: true })).not.toThrow()
  })
})

describe('validate acceptance', () => {
  it('throws an error if the field is not true', () => {
    const values = [null, undefined, 0, 1, '1', 'true']

    values.forEach((val) => {
      expect(() => validate('terms', val, { acceptance: true })).toThrow(
        ValidationErrors.AcceptanceValidationError
      )
    })
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

  it('does not throw an error if the field is present', () => {
    expect(() => validate('terms', true, { acceptance: true })).not.toThrow()
  })

  it('does not throw an error if the value is in listed of accepted values', () => {
    expect(() =>
      validate('terms', 'true', {
        acceptance: {
          in: ['true'],
        },
      })
    ).not.toThrow()
  })
})

describe('validate exclusion', () => {
  it('throws an error if the field is in a given list of values, no options format', () => {
    expect(() =>
      validate('selection', 'foo', { exclusion: ['foo', 'bar'] })
    ).toThrow(ValidationErrors.ExclusionValidationError)
  })

  it('throws an error if the field is in a given list of values, with options format', () => {
    expect(() =>
      validate('selection', 'bar', { exclusion: { in: ['foo', 'bar'] } })
    ).toThrow(ValidationErrors.ExclusionValidationError)
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

  it('does not throw if the field is not in the list', () => {
    expect(() =>
      validate('selection', 'qux', { exclusion: ['foo', 'bar'] })
    ).not.toThrow()
  })
})

describe('validate format', () => {
  it('throws an error if the field does not match a pattern, flat format', () => {
    expect(() => validate('text', 'foobar', { format: /baz/ })).toThrow(
      ValidationErrors.FormatValidationError
    )
  })

  it('throws an error if the field does not match a pattern, option format', () => {
    expect(() => validate('text', 'foobar', { format: /baz/ })).toThrow(
      ValidationErrors.FormatValidationError
    )
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

  it('does not throw if the field is in the list', () => {
    const patterns = [/foo/, /^foo/]

    patterns.forEach((pattern) => {
      expect(() =>
        validate('text', 'foobar', { format: pattern })
      ).not.toThrow()
    })
  })
})

describe('validate inclusion', () => {
  it('throws an error if the field is not in a given list of values, no options format', () => {
    expect(() =>
      validate('selection', 'qux', { inclusion: ['foo', 'bar'] })
    ).toThrow(ValidationErrors.InclusionValidationError)
  })

  it('throws an error if the field is not in a given list of values, with options format', () => {
    expect(() =>
      validate('selection', 'quux', { inclusion: { in: ['foo', 'bar'] } })
    ).toThrow(ValidationErrors.InclusionValidationError)
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

  it('does not throw if the field is in the list', () => {
    expect(() =>
      validate('selection', 'foo', { inclusion: ['foo', 'bar'] })
    ).not.toThrow()
  })
})

describe('validate length', () => {
  it('throws an error if the field is shorter than minimum', () => {
    expect(() => validate('username', 'a', { length: { min: 2 } })).toThrow(
      ValidationErrors.MinLengthValidationError
    )
  })

  it('throws min length error with a default message', () => {
    try {
      validate('username', 'a', { length: { min: 2 } })
    } catch (e) {
      expect(e.message).toEqual('username must have more than 2 characters')
    }
  })

  it('throws min length error with a custom message', () => {
    try {
      validate('username', 'a', { length: { min: 2, message: 'too short' } })
    } catch (e) {
      expect(e.message).toEqual('too short')
    }
  })

  it('throws an error if the field is longer than maximum', () => {
    expect(() =>
      validate('username', 'johndoeesquirethethird', { length: { max: 10 } })
    ).toThrow(ValidationErrors.MaxLengthValidationError)
  })

  it('throws max length error with a default message', () => {
    try {
      validate('username', 'jeff', { length: { max: 2 } })
    } catch (e) {
      expect(e.message).toEqual('username must have less than 2 characters')
    }
  })

  it('throws max length error with a custom message', () => {
    try {
      validate('username', 'jill', { length: { max: 2, message: 'too long' } })
    } catch (e) {
      expect(e.message).toEqual('too long')
    }
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
  })

  it('throws equal length error with a default message', () => {
    try {
      validate('username', 'foobar', { length: { equal: 5 } })
    } catch (e) {
      expect(e.message).toEqual('username does not have exactly 5 characters')
    }
  })

  it('throws equal length error with a custom message', () => {
    try {
      validate('username', 'foobar', {
        length: { equal: 5, message: 'wrong length' },
      })
    } catch (e) {
      expect(e.message).toEqual('wrong length')
    }
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
  })

  it('throws between length error with a default message', () => {
    try {
      validate('username', 'foobar', { length: { between: [2, 4] } })
    } catch (e) {
      expect(e.message).toEqual('username must be between 2 and 4 characters')
    }
  })

  it('throws between length error with a custom message', () => {
    try {
      validate('username', 'foobar', {
        length: { between: [2, 4], message: 'not enough or too many' },
      })
    } catch (e) {
      expect(e.message).toEqual('not enough or too many')
    }
  })

  it('does not throw if the field is within the right length rante', () => {
    // above minimum
    expect(() =>
      validate('username', 'foobar', { length: { min: 4 } })
    ).not.toThrow()

    // below maximum
    expect(() =>
      validate('username', 'foobar', { length: { max: 8 } })
    ).not.toThrow()

    // equal
    expect(() =>
      validate('username', 'foobar', { length: { equal: 6 } })
    ).not.toThrow()

    // between
    expect(() =>
      validate('username', 'foobar', { length: { between: [2, 10] } })
    ).not.toThrow()

    // multiple
    expect(() =>
      validate('username', 'foobar', { length: { min: 4, max: 8 } })
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

  it('does not throw an error if the field is present', () => {
    expect(() =>
      validate('email', 'rob@redwoodjs.com', { presence: true })
    ).not.toThrow()
  })
})
