import {
  createGraphQLHandler,
  makeMergedSchema,
  makeServices,
} from '@redwoodjs/api'

import schemas from 'src/graphql/**/*.{js,ts}'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'
import services from 'src/services/**/*.{js,ts}'

export const handler = createGraphQLHandler({
  logger,
  schema: makeMergedSchema({
    schemas,
    services: makeServices({ services }),
  }),
  tracing: true,
  plugins: [
    {
      requestDidStart(requestContext) {
        const childLogger = requestContext.logger.child({
          name: 'apollo-graphql-server',
        })

        childLogger.info(
          {
            metrics: requestContext.metrics,
          },
          'GraphQL requestDidStart'
        )

        return {
          executionDidStart(requestContext) {
            childLogger.debug(
              {
                operationName: requestContext.operationName,
                metrics: requestContext.metrics,
              },
              'GraphQL executionDidStart'
            )
          },
          willSendResponse(requestContext) {
            childLogger.info(
              {
                response: requestContext.response,
                metrics: requestContext.metrics,
              },
              'GraphQL willSendResponse'
            )
          },
          didEncounterErrors(requestContext) {
            childLogger.error(
              {
                errors: requestContext.errors,
                metrics: requestContext.metrics,
              },
              'GraphQL didEncounterErrors'
            )
          },
        }
      },
    },
  ],
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect()
  },
})
