import { Resend } from 'resend'
import type { Tag } from 'resend/build/src/interfaces'

import type {
  MailSendOptionsComplete,
  MailRenderedContent,
  MailResult,
} from '@redwoodjs/mailer-core'
import { AbstractMailHandler } from '@redwoodjs/mailer-core'

export type ResendMailHandlerOptions = {
  tags?: Tag[]
}

export class ResendMailHandler extends AbstractMailHandler {
  private client: Resend

  constructor({ apiToken }: { apiToken: string }) {
    super()
    this.client = new Resend(apiToken)
  }

  async send(
    content: MailRenderedContent,
    sendOptions: MailSendOptionsComplete,
    handlerOptions?: ResendMailHandlerOptions
  ): Promise<MailResult> {
    const result = await this.client.emails.send({
      // Standard options
      attachments: sendOptions.attachments,
      bcc: sendOptions.bcc,
      cc: sendOptions.cc,
      from: sendOptions.from,
      headers: sendOptions.headers,
      reply_to: sendOptions.replyTo,
      subject: sendOptions.subject,
      to: sendOptions.to,

      // Content
      html: content.html,
      text: content.text,

      // Resend specific options
      tags: handlerOptions?.tags ?? [],
    })

    return {
      messageID: result.id,
      handlerInformation: result,
    }
  }

  internal() {
    return {
      client: this.client,
    }
  }
}
