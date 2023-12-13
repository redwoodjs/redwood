import * as Sentry from '@sentry/node'

import { db as client } from 'src/lib/db'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.Integrations.Prisma({ client })],
  tracesSampleRate: 1.0,
})

export default Sentry
