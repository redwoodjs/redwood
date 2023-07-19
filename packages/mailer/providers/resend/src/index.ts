import { Resend } from 'resend'
import type { CreateEmailOptions } from 'resend/build/src/emails/interfaces'

import { MailProvider } from '@redwoodjs/mailer-core'
import type {
  MailerSendOptionsDefaulted,
  MailerTemplateType,
} from '@redwoodjs/mailer-core'
// TODO: Use just /renderer by providing an export in the package.json
import { MailRenderer } from '@redwoodjs/mailer-core/dist/renderer'

export interface ResendMailProviderConfig {
  token: string
}

export interface ResendMailProviderOptions {}

export class ResendMailProvider extends MailProvider {
  private resend

  constructor(config: ResendMailProviderConfig) {
    super()
    this.resend = new Resend(config.token)
  }

  async send(
    template: MailerTemplateType,
    options: MailerSendOptionsDefaulted,
    _providerOptions?: ResendMailProviderOptions
  ): Promise<void> {
    const content = MailRenderer.render(template, options.format)

    let resendOptions: CreateEmailOptions
    if (options.format === 'html') {
      resendOptions = {
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        from: options.from,
        html: content,
        headers: options.headers,
      }
    } else {
      resendOptions = {
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        from: options.from,
        text: content,
        headers: options.headers,
      }
    }

    const result = await this.resend.emails.send(resendOptions)
    console.log(result)
  }

  exposed(): Record<string, unknown> {
    return {
      resend: this.resend,
    }
  }
}
