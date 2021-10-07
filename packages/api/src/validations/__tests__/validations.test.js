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
      expect(e.message).toEqual('email is present')
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
