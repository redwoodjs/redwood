describe('useInngest', () => {
  describe('when depthLimitOptions is not configured in the GraphQL handler', () => {
    it('makes no changes', async () => {
      await matchTransformSnapshot('useInngest', 'default')
    })
  })

  describe('when depthLimitOptions is configured in the GraphQL handler', () => {
    xit('Modifies depthLimitOptions to use GraphQL Armor settings', async () => {
      await matchTransformSnapshot('useInngest', 'graphql')
    })

    xit('Modifies depthLimitOptions to use GraphQL Armor settings (inline)', async () => {
      await matchInlineTransformSnapshot(
        'useInngest',
        `import { createGraphQLHandler } from '@redwoodjs/graphql-server'

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
      })`,
        `import { createGraphQLHandler } from '@redwoodjs/graphql-server'

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
        armorConfig: { maxDepth: { n: 42 } },

        onException: () => {
          // Disconnect from your database with an unhandled exception.
          db.$disconnect()
        },
      })`
      )
    })
  })
})
