import { Resend } from 'resend'
import type { CreateEmailOptions } from 'resend/build/src/emails/interfaces'

import { MailHandler } from '@redwoodjs/mailer-core'
import type { CompleteSendOptions, MailTemplate } from '@redwoodjs/mailer-core'
// TODO: Use just /renderer by providing an export in the package.json?
import { MailRenderer } from '@redwoodjs/mailer-core/dist/renderer'

export interface HandlerConfig {
  token: string
}

export interface HandlerOptions {
  tags?: { name: string; value: string }[]
}

export class ResendMailHandler extends MailHandler {
  private resend

  constructor(config: HandlerConfig) {
    super()
    this.resend = new Resend(config.token)
  }

  async send(
    template: MailTemplate,
    generalOptions: CompleteSendOptions,
    handlerOptions?: HandlerOptions
  ): Promise<void> {
    const content = MailRenderer.render(template, generalOptions.format)

    let resendOptions: CreateEmailOptions
    if (generalOptions.format === 'html') {
      resendOptions = {
        to: generalOptions.to,
        cc: generalOptions.cc,
        bcc: generalOptions.bcc,
        subject: generalOptions.subject,
        from: generalOptions.from,
        html: content,
        headers: generalOptions.headers,
        tags: handlerOptions?.tags,
      }
    } else {
      resendOptions = {
        to: generalOptions.to,
        cc: generalOptions.cc,
        bcc: generalOptions.bcc,
        subject: generalOptions.subject,
        from: generalOptions.from,
        text: content,
        headers: generalOptions.headers,
        tags: handlerOptions?.tags,
      }
    }

    const result = await this.resend.emails.send(resendOptions)
    console.log(result)
  }

  internal() {
    return {
      resend: this.resend,
    }
  }
}
