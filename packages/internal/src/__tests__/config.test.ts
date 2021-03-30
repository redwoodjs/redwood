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
          "schemaPath": "./api/prisma/schema.prisma",
          "target": "node",
        },
        "browser": Object {
          "open": false,
        },
        "web": Object {
          "a11y": true,
          "apiProxyPath": "/.netlify/functions",
          "apiProxyPort": 8911,
          "experimentalFastRefresh": false,
          "host": "localhost",
          "path": "./web",
          "port": 8910,
          "target": "browser",
        },
      }
    `)
  })

  it('merges configs', () => {
    const config = getConfig(path.join(__dirname, './fixtures/redwood.toml'))
    expect(config.web.port).toEqual(8888)
  })
})
