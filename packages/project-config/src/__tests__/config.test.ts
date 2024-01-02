import path from 'path'

import { getConfig, getRawConfig } from '../config'

describe('getRawConfig', () => {
  it('returns nothing for an empty config', () => {
    const config = getRawConfig(
      path.join(__dirname, './fixtures/redwood.empty.toml')
    )
    expect(config).toMatchInlineSnapshot(`{}`)
  })

  it('returns only the defined values', () => {
    const config = getRawConfig(path.join(__dirname, './fixtures/redwood.toml'))
    expect(config).toMatchInlineSnapshot(`
      {
        "web": {
          "port": 8888,
        },
      }
    `)
  })
})

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
        "experimental": {
          "cli": {
            "autoInstall": true,
            "plugins": [
              {
                "package": "@redwoodjs/cli-storybook",
              },
              {
                "package": "@redwoodjs/cli-data-migrate",
              },
            ],
          },
          "opentelemetry": {
            "enabled": false,
            "wrapApi": true,
          },
          "realtime": {
            "enabled": false,
          },
          "rsc": {
            "enabled": false,
          },
          "streamingSsr": {
            "enabled": false,
          },
          "studio": {
            "basePort": 4318,
            "graphiql": {
              "authImpersonation": {
                "authProvider": undefined,
                "email": undefined,
                "jwtSecret": "secret",
                "roles": undefined,
                "userId": undefined,
              },
              "endpoint": "graphql",
            },
            "inMemory": false,
          },
          "useSDLCodeGenForGraphQLTypes": false,
        },
        "generate": {
          "nestScaffoldByModel": true,
          "stories": true,
          "tests": true,
        },
        "graphql": {
          "fragments": false,
          "trustedDocuments": false,
        },
        "notifications": {
          "versionUpdates": [],
        },
        "web": {
          "a11y": true,
          "apiUrl": "/.redwood/functions",
          "bundler": "vite",
          "fastRefresh": true,
          "host": "localhost",
          "includeEnvironmentVariables": [],
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

    expect(config.experimental.studio.inMemory).toEqual(false)
    expect(config.experimental.studio.graphiql?.endpoint).toEqual('graphql')
  })

  describe('with studio configs', () => {
    it('merges studio configs', () => {
      const config = getConfig(
        path.join(__dirname, './fixtures/redwood.studio.toml')
      )

      expect(config.experimental.studio.inMemory).toEqual(false)
      expect(config.experimental.studio.graphiql?.endpoint).toEqual(
        'graphql-endpoint'
      )
    })

    it('merges studio configs with dbAuth impersonation', () => {
      const config = getConfig(
        path.join(__dirname, './fixtures/redwood.studio.dbauth.toml')
      )
      expect(config.experimental.studio.inMemory).toEqual(false)
      expect(config.experimental.studio.graphiql?.endpoint).toEqual('graphql')
      expect(
        config.experimental.studio.graphiql?.authImpersonation?.authProvider
      ).toEqual('dbAuth')
      expect(
        config.experimental.studio.graphiql?.authImpersonation?.email
      ).toEqual('user@example.com')
      expect(
        config.experimental.studio.graphiql?.authImpersonation?.userId
      ).toEqual('1')
    })

    it('merges studio configs with supabase impersonation', () => {
      const config = getConfig(
        path.join(__dirname, './fixtures/redwood.studio.supabase.toml')
      )

      expect(config.experimental.studio.inMemory).toEqual(false)
      expect(config.experimental.studio.graphiql?.endpoint).toEqual('graphql')
      expect(
        config.experimental.studio.graphiql?.authImpersonation?.authProvider
      ).toEqual('supabase')
      expect(
        config.experimental.studio.graphiql?.authImpersonation?.email
      ).toEqual('supauser@example.com')
      expect(
        config.experimental.studio.graphiql?.authImpersonation?.userId
      ).toEqual('1')
      expect(
        config.experimental.studio.graphiql?.authImpersonation?.jwtSecret
      ).toEqual('supa-secret')
    })
  })

  describe('with graphql configs', () => {
    describe('sets defaults', () => {
      it('sets trustedDocuments to false', () => {
        const config = getConfig(
          path.join(__dirname, './fixtures/redwood.toml')
        )
        expect(config.graphql.trustedDocuments).toEqual(false)
        expect(config.graphql.fragments).toEqual(false)
      })
    })

    it('merges graphql configs', () => {
      const config = getConfig(
        path.join(__dirname, './fixtures/redwood.graphql.toml')
      )
      expect(config.graphql.trustedDocuments).toEqual(true)
      expect(config.graphql.fragments).toEqual(true)
    })
  })

  it('throws an error when given a bad config path', () => {
    const runGetConfig = () => {
      getConfig(path.join(__dirname, './fixtures/fake_redwood.toml'))
    }
    expect(runGetConfig).toThrow(
      /Could not parse .+fake_redwood.toml.+ Error: ENOENT: no such file or directory, open .+fake_redwood.toml./
    )
  })

  it('interpolates environment variables correctly', () => {
    process.env.API_URL = '/bazinga'
    process.env.APP_ENV = 'staging'

    const config = getConfig(
      path.join(__dirname, './fixtures/redwood.withEnv.toml')
    )

    // Fallsback to the default if env var not supplied
    expect(config.web.port).toBe('8910') // remember env vars have to be strings

    // Uses the env var if supplied
    expect(config.web.apiUrl).toBe('/bazinga')
    expect(config.web.title).toBe('App running on staging')

    delete process.env.API_URL
    delete process.env.APP_ENV
  })
})
