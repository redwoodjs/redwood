import { Resend } from 'resend'
import type { CreateEmailOptions } from 'resend/build/src/emails/interfaces'

import { MailHandler } from '@redwoodjs/mailer-core'
import type {
  CompleteSendOptions,
  MailResult,
  MailTemplate,
} from '@redwoodjs/mailer-core'
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
  ): Promise<MailResult> {
    const { text, html } = MailRenderer.render(template, generalOptions.format)

    // @ts-expect-error - Fix the "at least one of these must be provided" error
    const resendOptions: CreateEmailOptions = {
      to: generalOptions.to,
      cc: generalOptions.cc,
      bcc: generalOptions.bcc,
      subject: generalOptions.subject,
      from: generalOptions.from,
      html,
      text,
      headers: generalOptions.headers,
      tags: handlerOptions?.tags,
    }

    const result = await this.resend.emails.send(resendOptions)
    return {
      messageID: result.id,
    }
  }

  internal() {
    return {
      resend: this.resend,
    }
  }
}
