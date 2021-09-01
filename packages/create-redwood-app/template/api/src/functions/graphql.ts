import {
  createGraphQLHandler,
  makeMergedSchema,
  makeServices,
} from '@redwoodjs/graphql-server'

import directives from 'src/directives/**/*.{js,ts}'
import schemas from 'src/graphql/**/*.{js,ts}'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'
import services from 'src/services/**/*.{js,ts}'

export const handler = createGraphQLHandler({
  loggerConfig: { logger, options: {} },
  // getCurrentUser
  schema: makeMergedSchema({
    schemas,
    services: makeServices({ services }),
  }),
  directives,
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect()
  },
})
