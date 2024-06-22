import path from 'node:path'

import { vol } from 'memfs'
import prompts from 'prompts'

import { type AuthHandlerArgs } from '@redwoodjs/cli-helpers'

jest.mock('fs', () => require('memfs').fs)

import { createAuthDecoderFunction, handler } from '../setupHandler'
import { getModelNames } from '../shared'

const RWJS_CWD = process.env.RWJS_CWD
const redwoodProjectPath = '/redwood-app'
const mockLoginPagePath = path.join(
  redwoodProjectPath,
  'web/src/pages/LoginPage/LoginPage.tsx',
)

jest.mock('prompts', () => {
  return {
    __esModule: true,
    default: jest.fn(async (args: any) => {
      return {
        [args.name]: false,
      }
    }),
  }
})

jest.mock('../shared', () => ({
  hasModel: () => false,
  hasAuthPages: () => {
    return require('fs').existsSync(mockLoginPagePath)
  },
  generateAuthPagesTask: () => undefined,
  getModelNames: () => ['ExampleUser'],
}))

jest.mock('@redwoodjs/cli-helpers', () => {
  return {
    getGraphqlPath: () => {
      return redwoodProjectPath + '/api/src/functions/graphql.ts'
    },
    addEnvVarTask: () => undefined,
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
    // I wish I could have used something like
    // jest.requireActual(@redwoodjs/cli-helpers) here, but I couldn't because
    // jest doesn't support ESM
    standardAuthHandler: async (args: AuthHandlerArgs) => {
      args.notes && console.log(`\n   ${args.notes.join('\n   ')}\n`)
    },
  }
})

beforeAll(() => {
  process.env.RWJS_CWD = redwoodProjectPath
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  jest.mocked(console).log.mockRestore?.()
  jest.mocked(prompts).mockClear?.()
})

describe('dbAuth setup command', () => {
  it('does not duplicate authDecoder creation', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')
    const graphqlTsPath = 'api/src/functions/graphql.ts'

    vol.fromJSON(
      {
        [packageJsonPath]: '{ "version": "0.0.0" }',
        [graphqlTsPath]: `
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

  it('prompts to generate pages', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')

    vol.fromJSON(
      {
        [packageJsonPath]: '{ "version": "0.0.0" }',
      },
      redwoodProjectPath,
    )

    await handler({
      webauthn: false,
      createUserModel: false,
      generateAuthPages: null,
      force: false,
    })

    expect(jest.mocked(prompts).mock.calls[0][0].message).toMatch(
      /Generate auth pages/,
    )
  })

  it('does not prompt to generate pages when pages already exist', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')

    vol.fromJSON(
      {
        [packageJsonPath]: '{ "version": "0.0.0" }',
        [mockLoginPagePath]: 'export default () => <div>Login</div>',
      },
      redwoodProjectPath,
    )

    await handler({
      webauthn: false,
      createUserModel: false,
      generateAuthPages: null,
      force: false,
    })

    expect(jest.mocked(prompts)).not.toHaveBeenCalled()
  })

  describe('One More Thing... message', () => {
    describe('page generation hint', () => {
      it('is not included if page generation was already done as part of the setup process', async () => {
        const packageJsonPath = path.resolve(__dirname, '../../package.json')

        vol.fromJSON(
          {
            [packageJsonPath]: '{ "version": "0.0.0" }',
          },
          redwoodProjectPath,
        )

        await handler({
          webauthn: false,
          createUserModel: false,
          generateAuthPages: true,
          force: false,
        })

        expect(jest.mocked(console).log.mock.calls[0][0]).not.toContain(
          'yarn rw generate dbAuth',
        )
      })

      it('is not included for WebAuthn if page generation was already done as part of the setup process', async () => {
        const packageJsonPath = path.resolve(__dirname, '../../package.json')

        vol.fromJSON(
          {
            [packageJsonPath]: '{ "version": "0.0.0" }',
          },
          redwoodProjectPath,
        )

        await handler({
          webauthn: true,
          createUserModel: false,
          generateAuthPages: true,
          force: false,
        })

        expect(jest.mocked(console).log.mock.calls[0][0]).not.toContain(
          'yarn rw generate dbAuth',
        )
      })

      it('is not included if page generation and model generation was already done as part of the setup process', async () => {
        const packageJsonPath = path.resolve(__dirname, '../../package.json')

        vol.fromJSON(
          {
            [packageJsonPath]: '{ "version": "0.0.0" }',
          },
          redwoodProjectPath,
        )

        await handler({
          webauthn: false,
          createUserModel: true,
          generateAuthPages: true,
          force: false,
        })

        expect(jest.mocked(console).log.mock.calls[0][0]).not.toContain(
          'yarn rw generate dbAuth',
        )
      })

      it('is not included for WebAuthn if page generation and model generation was already done as part of the setup process', async () => {
        const packageJsonPath = path.resolve(__dirname, '../../package.json')

        vol.fromJSON(
          {
            [packageJsonPath]: '{ "version": "0.0.0" }',
          },
          redwoodProjectPath,
        )

        await handler({
          webauthn: true,
          createUserModel: true,
          generateAuthPages: true,
          force: false,
        })

        expect(jest.mocked(console).log.mock.calls[0][0]).not.toContain(
          'yarn rw generate dbAuth',
        )
      })

      it('is included if page generation was not done as part of the setup process', async () => {
        const packageJsonPath = path.resolve(__dirname, '../../package.json')

        vol.fromJSON(
          {
            [packageJsonPath]: '{ "version": "0.0.0" }',
          },
          redwoodProjectPath,
        )

        await handler({
          webauthn: false,
          createUserModel: false,
          generateAuthPages: false,
          force: false,
        })

        const logs: string[][] = [...jest.mocked(console).log.mock.calls]
        const oneMoreThingMessage = logs.find((log) => {
          return log[0].includes('Done! But you have a little more work to do')
        })?.[0]

        // Included exactly once
        expect(
          oneMoreThingMessage?.match(/yarn rw generate dbAuth/g),
        ).toHaveLength(1)
      })

      it('is included for WebAuthn if page generation was not done as part of the setup process', async () => {
        const packageJsonPath = path.resolve(__dirname, '../../package.json')

        vol.fromJSON(
          {
            [packageJsonPath]: '{ "version": "0.0.0" }',
          },
          redwoodProjectPath,
        )

        await handler({
          webauthn: true,
          createUserModel: false,
          generateAuthPages: false,
          force: false,
        })

        const firstLogMessage = jest.mocked(console).log.mock.calls[0][0]

        // Included exactly once
        expect(firstLogMessage.match(/and WebAuthn prompts/g)).toHaveLength(1)
        expect(firstLogMessage.match(/yarn rw generate dbAuth/g)).toHaveLength(
          1,
        )
      })
    })
  })
})
