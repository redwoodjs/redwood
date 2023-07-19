import { MailProvider } from './provider'
import type {
  MailerConfig,
  MailerSendOptions,
  MailerTemplateType,
} from './types'

export class Mailer {
  providers: Map<string, MailProvider>
  private config: MailerConfig

  constructor(
    providers: Map<string, MailProvider>,
    config: Partial<MailerConfig>
  ) {
    this.providers = providers
    const defaultProvider = Array.from(this.providers.keys())[0]

    this.config = {
      defaultProvider,
      defaultFormat: 'html',
      ...config,
    }
  }

  async send(
    template: MailerTemplateType,
    options: MailerSendOptions,
    providerOptions?: unknown
  ) {
    const providerKey = options.provider ?? this.config.defaultProvider
    const provider = this.providers.get(providerKey)

    if (provider === undefined) {
      throw new Error(`No provider found for ${providerKey}`)
    }

    return provider.send(
      template,
      {
        format: this.config.defaultFormat,
        provider: providerKey,
        cc: [],
        bcc: [],
        from: '',
        headers: {},
        ...options,
      },
      providerOptions
    )
  }
}
