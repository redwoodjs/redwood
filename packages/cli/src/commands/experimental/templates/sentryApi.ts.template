import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'

import { db as client } from 'src/lib/db'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Tracing.Integrations.Prisma({ client })],
  tracesSampleRate: 1.0,
})

export default Sentry
