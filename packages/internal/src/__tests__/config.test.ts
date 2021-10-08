import path from 'path'

import { getConfig } from '../config'

describe('getConfig', () => {
  it('returns a default config', () => {
    const config = getConfig(
      path.join(__dirname, './fixtures/redwood.empty.toml')
    )
    expect(config).toMatchInlineSnapshot(`
      Object {
        "api": Object {
          "host": "localhost",
          "path": "./api",
          "port": 8911,
          "schemaPath": "./api/db/schema.prisma",
          "target": "node",
          "title": "Redwood App",
        },
        "browser": Object {
          "open": false,
        },
        "experimental": Object {
          "esbuild": false,
        },
        "generate": Object {
          "nestScaffoldByModel": true,
          "stories": true,
          "tests": true,
        },
        "web": Object {
          "a11y": true,
          "apiDbAuthURL": "/.redwood/functions/auth",
          "apiGraphQLURL": "/.redwood/functions/graphql",
          "apiURL": "/.redwood/functions",
          "fastRefresh": true,
          "host": "localhost",
          "path": "./web",
          "port": 8910,
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
})
