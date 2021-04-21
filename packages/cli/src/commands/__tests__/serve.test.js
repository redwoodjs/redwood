import 'src/lib/test'

jest.mock('@redwoodjs/api-server', () => {
  return {
    ...jest.requireActual('@redwoodjs/api-server'),
    apiServerHandler: jest.fn(),
  }
})

import yargs from 'yargs'

import { apiServerHandler } from '@redwoodjs/api-server'

import { builder } from '../serve'

describe('yarn rw serve', () => {
  jest.mock('fs', () => {
    return {
      ...jest.requireActual('fs'),
      existsSync: () => true,
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should proxy the command with params to api-server handler', async () => {
    const parser = yargs.command('serve', false, builder)

    parser.parse('serve api --bazinga')

    expect(apiServerHandler).toHaveBeenCalledWith({
      port: 5551,
      rootPath: '/rooty/mcRoot',
    })
  })
})
