import { Mailer } from '@redwoodjs/mailer-core'
import { InMemoryMailHandler } from '@redwoodjs/mailer-handler-in-memory'
import { NodemailerMailHandler } from '@redwoodjs/mailer-handler-nodemailer'
import { StudioMailHandler } from '@redwoodjs/mailer-handler-studio'
import { ReactEmailRenderer } from '@redwoodjs/mailer-renderer-react-email'

import { logger } from './logger'

export const mailer = new Mailer({
  // Handlers to send our emails out to the world
  handling: {
    handlers: {
      inMemory: new InMemoryMailHandler(),
      studio: new StudioMailHandler(),
      // TODO: Update this handler config or switch it out for a different handler completely
      nodemailer: new NodemailerMailHandler({
        transport: {
          host: 'localhost',
          port: 4319,
          secure: false,
        },
      }),
    },
    // This is our default handler when in production only
    default: 'nodemailer',
  },

  // Renderers to convert our templates into HTML/text
  rendering: {
    renderers: {
      reactEmail: new ReactEmailRenderer(),
    },
    default: 'reactEmail',
  },

  // Specific handlers for testing and development time
  test: {
    handler: 'inMemory',
    // when: process.env.NODE_ENV === 'test',
  },
  development: {
    handler: 'studio',
    // when: process.env.NODE_ENV !== 'production',
  },

  // Default send options
  defaults: {
    // replyTo: 'noreply@example.com',
  },

  logger,
})
