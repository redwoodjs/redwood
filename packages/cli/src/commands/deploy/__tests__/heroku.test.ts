import { builder, handler, command, description } from '../heroku'

jest.mock('../../../lib')

it('exports required methods', () => {
  expect(command).toBe('heroku')
  expect(description).toBe('Setup and deploy to Heroku')
  expect(builder).toBeInstanceOf(Function)
  expect(handler).toBeInstanceOf(Function)
})
