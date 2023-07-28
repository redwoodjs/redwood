import type { Logger } from '@redwoodjs/api/logger'

import type {
  MailerConfig,
  MailerSendOptions,
  MailTemplate,
  MailHandlers,
} from './types'

export class Mailer<
  THandlers extends MailHandlers,
  TDefault extends keyof THandlers
> {
  protected logger: Logger | typeof console

  constructor(
    public handlers: THandlers,
    private config: MailerConfig<THandlers, TDefault>
  ) {
    // Logger
    if (this.config.logger !== undefined) {
      this.logger = this.config.logger.child({ module: 'mailer' })
    } else {
      this.logger = console
    }

    this.logger.debug(
      {
        handlers: this.handlers,
        config: this.config,
      },
      'Mailer created'
    )
  }

  formatAddress(address: string, name?: string) {
    return name ? `${name} <${address}>` : address
  }

  // TODO: Ensure this is correct and robust
  private isDev() {
    if (this.config.isDev === undefined) {
      return process.env.NODE_ENV !== 'production'
    } else if (typeof this.config.isDev === 'boolean') {
      return this.config.isDev
    } else {
      return this.config.isDev()
    }
  }

  // TODO: Ensure this is correct and robust
  private isTest() {
    if (this.config.isTest === undefined) {
      return process.env.NODE_ENV === 'test'
    } else if (typeof this.config.isTest === 'boolean') {
      return this.config.isTest
    } else {
      return this.config.isTest()
    }
  }

  async send<U extends keyof THandlers = TDefault>(
    template: MailTemplate,
    generalOptions: MailerSendOptions<THandlers, U>,
    handlerOptions?: Parameters<THandlers[U]['send']>[2]
  ) {
    const handlerKey = generalOptions.handler ?? this.config.defaultHandler
    const handler = this.handlers[handlerKey]

    if (handler === undefined) {
      throw new Error(`No provider found for ${handlerKey.toString()}`)
    }

    const to = Array.isArray(generalOptions.to)
      ? generalOptions.to
      : [generalOptions.to]
    const cc =
      generalOptions.cc === undefined
        ? []
        : Array.isArray(generalOptions.cc)
        ? generalOptions.cc
        : [generalOptions.cc]
    const bcc =
      generalOptions.bcc === undefined
        ? []
        : Array.isArray(generalOptions.bcc)
        ? generalOptions.bcc
        : [generalOptions.bcc]

    const from = generalOptions.from ?? this.config.defaultFrom
    const replyTo = generalOptions.replyTo
    const subject = generalOptions.subject
    const headers = generalOptions.headers ?? {}
    const attachments = generalOptions.attachments ?? []
    const format =
      generalOptions.format ?? this.config.defaultRenderFormat ?? 'both'

    const generalOptionsComplete = {
      to,
      cc,
      bcc,
      from,
      replyTo,
      format,
      subject,
      headers,
      attachments,
    }

    // If we're testing send the mail with the test handler
    if (this.isTest()) {
      const testHandlerKey = this.config.testHandler
      if (testHandlerKey === undefined) {
        this.logger.warn('No test handler configured, not sending mail!')
        return {}
      }
      const testHandler = this.handlers[testHandlerKey]
      if (testHandler === undefined) {
        throw new Error(`No provider found for ${testHandlerKey.toString()}`)
      }

      this.logger.debug(
        {
          ...generalOptionsComplete,
          attributes: undefined,
        },
        `Sending mail with test handler '${testHandlerKey.toString()}'`
      )
      return await testHandler.send(
        template,
        generalOptionsComplete,
        handlerOptions,
        {
          logger: this.logger,
        }
      )
    }

    // If we're in development send the mail with the dev handler
    if (this.isDev()) {
      const devHandlerKey = this.config.devHandler
      if (devHandlerKey === undefined) {
        this.logger.warn('No dev handler configured, not sending mail!')
        return {}
      }
      const devHandler = this.handlers[devHandlerKey]
      if (devHandler === undefined) {
        throw new Error(`No provider found for ${devHandlerKey.toString()}`)
      }

      this.logger.debug(
        {
          ...generalOptionsComplete,
          attributes: undefined,
        },
        `Sending mail with dev handler '${devHandlerKey.toString()}'`
      )
      return await devHandler.send(
        template,
        generalOptionsComplete,
        handlerOptions,
        {
          logger: this.logger,
        }
      )
    }

    // Send the mail with the production handler
    this.logger.debug(
      {
        ...generalOptionsComplete,
        attributes: undefined,
      },
      'Sending mail '
    )
    const result = await handler.send(
      template,
      generalOptionsComplete,
      handlerOptions,
      {
        logger: this.logger,
      }
    )

    this.logger.debug({ result }, 'Mail sent')

    return result
  }
}
