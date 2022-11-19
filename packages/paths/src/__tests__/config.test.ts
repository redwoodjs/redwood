import path from 'path'

import { getConfig } from '../config'

describe('getConfig', () => {
  it('returns a default config', () => {
    const config = getConfig(
      path.join(__dirname, './fixtures/redwood.empty.toml')
    )
    expect(config).toMatchInlineSnapshot(`
      {
        "api": {
          "debugPort": 18911,
          "host": "localhost",
          "path": "./api",
          "port": 8911,
          "schemaPath": "./api/db/schema.prisma",
          "serverConfig": "./api/server.config.js",
          "target": "node",
          "title": "Redwood App",
        },
        "browser": {
          "open": false,
        },
        "generate": {
          "nestScaffoldByModel": true,
          "stories": true,
          "tests": true,
        },
        "web": {
          "a11y": true,
          "apiUrl": "/.redwood/functions",
          "fastRefresh": true,
          "host": "localhost",
          "path": "./web",
          "port": 8910,
          "sourceMap": false,
          "target": "browser",
          "title": "Redwood App",
        },
      }
    `)
  })

  it('merges configs', () => {
    const config = getConfig(path.join(__dirname, './fixtures/redwood.toml'))
    expect(config.web.port).toEqual(8888)
  })

  it('interpolates environment variables correctly', () => {
    process.env.API_URL = '/bazinga'
    process.env.APP_ENV = 'staging'

    const config = getConfig(
      path.join(__dirname, './fixtures/redwood.withEnv.toml')
    )

    // Fallsback to the defualt if env var not supplied
    expect(config.web.port).toBe('8910') // remember env vars have to be strings

    // Uses the env var if supplied
    expect(config.web.apiUrl).toBe('/bazinga')
    expect(config.web.title).toBe('App running on staging')

    delete process.env['API_URL']
    delete process.env['APP_ENV']
  })
})
