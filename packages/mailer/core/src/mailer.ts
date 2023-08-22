import type { Logger } from '@redwoodjs/api/logger'

import type {
  MailerConfig,
  MailSendOptions,
  MailHandlers,
  MailRenderers,
  DefaultSendOptions,
} from './types'
import { convertAddress, convertAddresses } from './utils'

export class Mailer<
  THandlers extends MailHandlers,
  TDefaultHandler extends keyof THandlers,
  TRenderers extends MailRenderers,
  TDefaultRenderer extends keyof TRenderers,
  TTestHandler extends keyof THandlers,
  TDevelopmentHandler extends keyof THandlers
> {
  protected logger: Logger | typeof console

  public mode: 'testing' | 'development' | 'production' = 'development'
  public handlers: THandlers
  public renderers: TRenderers

  private defaults: Omit<DefaultSendOptions, 'from' | 'replyTo'> & {
    from?: string
    replyTo?: string
  } = {
    attachments: [],
    bcc: [],
    cc: [],
    from: undefined,
    headers: {},
    replyTo: undefined,
  }

  constructor(
    public config: MailerConfig<
      THandlers,
      TDefaultHandler,
      TRenderers,
      TDefaultRenderer,
      TTestHandler,
      TDevelopmentHandler
    >
  ) {
    // Config
    this.handlers = this.config.handling.handlers
    this.renderers = this.config.rendering.renderers

    // Logger
    this.logger = this.config.logger
      ? this.config.logger.child({ module: 'mailer' })
      : console

    // Construct defaults from config
    if (this.config.defaults !== undefined) {
      if (this.config.defaults.attachments !== undefined) {
        this.defaults.attachments = this.config.defaults.attachments
      }
      if (this.config.defaults.bcc !== undefined) {
        this.defaults.bcc = convertAddresses(
          Array.isArray(this.config.defaults.bcc)
            ? this.config.defaults.bcc
            : [this.config.defaults.bcc]
        )
      }
      if (this.config.defaults.cc !== undefined) {
        this.defaults.cc = convertAddresses(
          Array.isArray(this.config.defaults.cc)
            ? this.config.defaults.cc
            : [this.config.defaults.cc]
        )
      }
      if (this.config.defaults.replyTo !== undefined) {
        this.defaults.replyTo = convertAddress(this.config.defaults.replyTo)
      }
      if (this.config.defaults.from !== undefined) {
        this.defaults.from = convertAddress(this.config.defaults.from)
      }
      if (this.config.defaults.headers !== undefined) {
        this.defaults.headers = this.config.defaults.headers
      }
    }

    // Validate default handlers
    if (this.config.handling.default === undefined) {
      this.logger.warn(
        'No default handler configured, this will prevent mail from being sent when no handler is explicitly specified'
      )
    } else if (this.handlers[this.config.handling.default] === undefined) {
      throw new Error(
        `The specified default handler '${this.config.handling.default.toString()}' is not defined`
      )
    }
    if (this.config.testHandler === undefined) {
      this.logger.warn(
        'No test handler configured, this will prevent mail from being sent in test mode'
      )
    } else if (this.handlers[this.config.testHandler] === undefined) {
      throw new Error(
        `The specified test handler '${this.config.testHandler.toString()}' is not defined`
      )
    }
    if (this.config.developmentHandler === undefined) {
      this.logger.warn(
        'No dev handler configured, this will prevent mail from being sent in development mode'
      )
    } else if (this.handlers[this.config.developmentHandler] === undefined) {
      throw new Error(
        `The specified dev handler '${this.config.developmentHandler.toString()}' is not defined`
      )
    }

    // Initial logging
    this.mode = this.isTest()
      ? 'testing'
      : this.isDevelopment()
      ? 'development'
      : 'production'
    this.logger.debug(
      {
        config: {
          testHandler: this.config.testHandler,
          developmentHandler: this.config.developmentHandler,
          defaultHandler: this.config.handling.default,
          defaults: this.config.defaults,
        },
        // handlers: Object.keys(this.handlers),
      },
      `Mailer initialized in ${this.mode} mode`
    )
  }

  private isDevelopment() {
    if (this.config.isDevelopment === undefined) {
      // TODO: Ensure this is a sensible default
      return process.env.NODE_ENV !== 'production'
    }
    if (typeof this.config.isDevelopment === 'boolean') {
      return this.config.isDevelopment
    }
    if (typeof this.config.isDevelopment === 'function') {
      return this.config.isDevelopment()
    }
    throw new Error('Invalid isDev configuration')
  }

  private isTest() {
    if (this.config.isTest === undefined) {
      // TODO: Ensure this is a sensible default
      return process.env.NODE_ENV === 'test'
    }
    if (typeof this.config.isTest === 'boolean') {
      return this.config.isTest
    }
    if (typeof this.config.isTest === 'function') {
      return this.config.isTest()
    }
    throw new Error('Invalid isTest configuration')
  }

  getTestHandler() {
    const handlerKey = this.config.testHandler
    if (handlerKey === undefined) {
      return undefined
    }
    return this.handlers[handlerKey]
  }

  getDevelopmentHandler() {
    const handlerKey = this.config.developmentHandler
    if (handlerKey === undefined) {
      return undefined
    }
    return this.handlers[handlerKey]
  }

  // TODO: Add a renderAndSend method that combines the render and send methods
  // TODO: Refactor the send method to not invoke the renderer directly

  async send<
    THandler extends keyof THandlers = TDefaultHandler,
    TRenderer extends keyof TRenderers = TDefaultRenderer
  >(
    template: Parameters<TRenderers[TRenderer]['render']>[0],
    sendOptions: MailSendOptions<THandlers, THandler, TRenderers, TRenderer>,
    handlerOptions?: Parameters<THandlers[THandler]['send']>[2],
    rendererOptions?: Parameters<TRenderers[TRenderer]['render']>[1]
  ) {
    const handlerKey = sendOptions.handler ?? this.config.handling.default
    if (handlerKey === undefined) {
      throw new Error('No handler specified and no default handler configured')
    }
    let handler = this.handlers[handlerKey]
    if (this.mode === 'testing') {
      if (this.config.testHandler === undefined) {
        return {}
      }
      handler = this.handlers[this.config.testHandler]
    }
    if (this.mode === 'development') {
      if (this.config.developmentHandler === undefined) {
        return {}
      }
      handler = this.handlers[this.config.developmentHandler]
    }
    if (handler === undefined) {
      throw new Error(`No handler found to match '${handlerKey.toString()}'`)
    }

    const to = convertAddresses(
      Array.isArray(sendOptions.to) ? sendOptions.to : [sendOptions.to]
    )
    if (to.length === 0) {
      throw new Error('No to address specified')
    }

    const cc =
      sendOptions.cc === undefined
        ? this.defaults.cc
        : convertAddresses(
            Array.isArray(sendOptions.cc) ? sendOptions.cc : [sendOptions.cc]
          )

    const bcc =
      sendOptions.bcc === undefined
        ? this.defaults.bcc
        : convertAddresses(
            Array.isArray(sendOptions.bcc) ? sendOptions.bcc : [sendOptions.bcc]
          )

    const from =
      sendOptions.from === undefined
        ? this.defaults.from
        : convertAddress(sendOptions.from)
    if (from === undefined) {
      throw new Error('No from address specified and no default configured')
    }

    const replyTo =
      sendOptions.replyTo === undefined
        ? this.defaults.replyTo
        : convertAddress(sendOptions.replyTo)

    const subject = sendOptions.subject
    if (subject === undefined) {
      throw new Error('No subject specified')
    }

    const headers = sendOptions.headers ?? this.defaults.headers
    const attachments = sendOptions.attachments ?? this.defaults.attachments

    // Render the mail using the renderer
    const chosenRendererKey =
      sendOptions.renderer ?? this.config.rendering.default
    if (chosenRendererKey === undefined) {
      throw new Error(
        'No renderer specified and no default renderer configured'
      )
    }
    const chosenRenderer = this.renderers[chosenRendererKey]
    if (chosenRenderer === undefined) {
      throw new Error(
        `No renderer found to match '${chosenRendererKey.toString()}'`
      )
    }

    const defaultedRendererOptions = {
      ...this.config.rendering.options?.[chosenRendererKey],
      ...rendererOptions,
    }
    const renderedContent = chosenRenderer.render(
      template,
      defaultedRendererOptions,
      {
        logger: this.logger,
      }
    )

    // Send the mail using the handler
    const result = await handler.send(
      renderedContent,
      {
        renderer: chosenRendererKey,
        handler: handlerKey,
        to,
        cc,
        bcc,
        from,
        replyTo,
        subject,
        headers,
        attachments,
      },
      handlerOptions,
      {
        logger: this.logger,
        rendererOptions: defaultedRendererOptions,
      }
    )
    this.logger.debug({ result }, 'Mail sent')
    return result
  }
}
