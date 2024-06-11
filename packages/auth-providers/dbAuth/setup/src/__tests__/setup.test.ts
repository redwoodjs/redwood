import path from 'node:path'

import { vol } from 'memfs'

jest.mock('fs', () => require('memfs').fs)

import { createAuthDecoderFunction } from '../setupHandler'

const RWJS_CWD = process.env.RWJS_CWD
const redwoodProjectPath = '/redwood-app'

jest.mock('../setupData', () => ({
  notes: '',
  extraTask: undefined,
}))

jest.mock('@redwoodjs/cli-helpers', () => {
  return {
    getGraphqlPath: () => {
      return redwoodProjectPath + '/api/src/functions/graphql.ts'
    },
    getPaths: () => ({
      base: redwoodProjectPath,
    }),
    colors: {
      error: (str: string) => str,
      warning: (str: string) => str,
      green: (str: string) => str,
      info: (str: string) => str,
      bold: (str: string) => str,
      underline: (str: string) => str,
    },
  }
})

beforeAll(() => {
  process.env.RWJS_CWD = redwoodProjectPath
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

describe('dbAuth setup command', () => {
  it('does not duplicate authDecoder creation', async () => {
    vol.fromJSON(
      {
        [path.resolve(__dirname, '../../package.json')]:
          '{ "version": "0.0.0" }',
        'api/src/functions/graphql.ts': `
import { createGraphQLHandler } from '@redwoodjs/graphql-server'

import directives from 'src/directives/**/*.{js,ts}'
import sdls from 'src/graphql/**/*.sdl.{js,ts}'
import services from 'src/services/**/*.{js,ts}'

import { getCurrentUser } from 'src/lib/auth'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const handler = createGraphQLHandler({
  getCurrentUser,
  loggerConfig: { logger, options: {} },
  directives,
  sdls,
  services,
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect()
  },
})
        `,
      },
      redwoodProjectPath,
    )

    createAuthDecoderFunction.task()
    const updatedGraphqlTs =
      vol.toJSON()[redwoodProjectPath + '/api/src/functions/graphql.ts']
    expect(updatedGraphqlTs).toMatch(/import { cookieName, getCurrentUser } fr/)
    expect(updatedGraphqlTs).toMatch(/const authDecoder = createAuthDecoder\(c/)
    expect(updatedGraphqlTs).toMatchSnapshot()

    // Running again shouldn't change anything in this case
    createAuthDecoderFunction.task()
    const updatedGraphqlTs2 =
      vol.toJSON()[redwoodProjectPath + '/api/src/functions/graphql.ts']
    expect(updatedGraphqlTs).toEqual(updatedGraphqlTs2)
  })
})
