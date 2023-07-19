import { MailProvider } from '@redwoodjs/mailer-core'
import type {
  MailerSendOptionsDefaulted,
  MailerTemplateType,
} from '@redwoodjs/mailer-core'
// TODO: Use just /renderer by providing an export in the package.json
import { MailRenderer } from '@redwoodjs/mailer-core/dist/renderer'

export interface SendGridMailProviderConfig {
  //
}

export interface SendGridMailProviderOptions {
  //
}

export class SendGridMailProvider extends MailProvider {
  constructor(private config: SendGridMailProviderConfig) {
    super()
  }

  async send(
    template: MailerTemplateType,
    options: MailerSendOptionsDefaulted,
    _providerOptions?: SendGridMailProviderOptions
  ): Promise<void> {
    const content = MailRenderer.render(template, options.format)
    console.dir(
      { provider: 'SendGrid', config: this.config, content },
      { depth: null }
    )
  }

  exposed(): Record<string, unknown> {
    return {}
  }
}
