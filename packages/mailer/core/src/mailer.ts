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
  constructor(
    public handlers: THandlers,
    private config: MailerConfig<TDefault>
  ) {}

  // TODO: What happens to provider specific details when you fallback so end up sending via a different provider?
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

    // Format these into arrays of strings for convenience in the providers
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

    return handler.send(
      template,
      {
        to,
        cc,
        bcc,
        from: generalOptions.from ?? this.config.defaultFrom,
        format:
          generalOptions.format ?? this.config.defaultRenderFormat ?? 'html',
        subject: generalOptions.subject,
        headers: generalOptions.headers ?? {},
      },
      handlerOptions
    )
  }
}
