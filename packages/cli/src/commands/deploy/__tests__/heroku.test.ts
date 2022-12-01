import { builder, handler, command, description } from '../heroku'

jest.mock('../../../lib')

it('exports required methods', () => {
  expect(command).toBe('heroku')
  expect(description).toBe('Setup Heroku deployment')
  expect(builder).toBeInstanceOf(Function)
  expect(handler).toBeInstanceOf(Function)
})
