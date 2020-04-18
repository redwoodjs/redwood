import { getEnvVars } from '../webpack.common'

jest.mock('@redwoodjs/internal', () => {
  return {
    getConfigPath: () => '/path/to/project/redwood.toml',
    getConfig: () => ({
      web: {
        includeEnvironmentVariables: ['API_KEY', 'API_SECRET'],
      },
    }),
    getPaths: () => ({
      web: {},
    }),
  }
})

describe('getEnvVars', () => {
  beforeEach(() => {})

  it('REDWOOD_ENV_ is filtered and transformed', () => {
    process.env['REDWOOD_ENV_TEST'] = 1234
    process.env['REDWOOD_X'] = false
    expect(getEnvVars()).toEqual({ 'process.env.REDWOOD_ENV_TEST': '"1234"' })

    delete process.env.REDWOOD_ENV_TEST
    delete process.env.REDWOOD_X
  })

  it('transforms and passes env vars defined in `redwood.toml`', () => {
    process.env['API_KEY'] = 'dog'
    process.env['API_SECRET'] = 'cat'
    process.env['API_SECRET2'] = 'chicken'
    expect(getEnvVars()).toEqual({
      'process.env.API_KEY': '"dog"',
      'process.env.API_SECRET': '"cat"',
    })
  })
})
