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
        "telemetry": Object {
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNTg3NjYxMywiZXhwIjoxOTQxNDUyNjEzfQ.xDvtPNKfE1GLMIKO5kKJnk_NaQpCDvPpsHij6iz2UX8",
          "url": "https://cuvvzwmeexzpnctfycwn.supabase.co/rest/v1",
        },
        "web": Object {
          "a11y": true,
          "apiProxyPath": "/.netlify/functions",
          "apiProxyPort": 8911,
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
