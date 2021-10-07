import * as ValidationErrors from '../errors'
import { validate } from '../validations'

describe('validate', () => {})

describe('validate presence', () => {
  it('throws an error if the field is null', () => {
    expect(() => validate('email', null, { presence: true })).toThrow(
      ValidationErrors.PresenceValidationError
    )
  })

  it('throws an error if the field is undefined', () => {
    expect(() => validate('email', undefined, { presence: true })).toThrow(
      ValidationErrors.PresenceValidationError
    )
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
