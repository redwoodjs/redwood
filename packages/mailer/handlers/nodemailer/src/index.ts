import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

import { MailHandler } from '@redwoodjs/mailer-core'
import type {
  CompleteSendOptions,
  MailResult,
  MailTemplate,
} from '@redwoodjs/mailer-core'
import { MailRenderer } from '@redwoodjs/mailer-core/dist/renderer'

export type HandlerConfig = {
  transport: SMTPTransport | SMTPTransport.Options | string
  defaults?: SMTPTransport.Options
}

export type HandlerOptions = nodemailer.SendMailOptions

export class NodemailerMailHandler extends MailHandler {
  protected transporter: nodemailer.Transporter

  constructor(protected config: HandlerConfig) {
    super()

    this.transporter = nodemailer.createTransport(
      config.transport,
      config.defaults
    )
  }

  // TODO: Ensure that handlerOptions are merged with generalOptions where appropriate
  async send(
    template: MailTemplate,
    generalOptions: CompleteSendOptions,
    handlerOptions?: HandlerOptions
  ): Promise<MailResult> {
    const { text, html } = MailRenderer.render(template, generalOptions.format)

    const result = await this.transporter.sendMail({
      to: generalOptions.to,
      cc: generalOptions.cc,
      bcc: generalOptions.bcc,
      from: generalOptions.from,
      replyTo: generalOptions.replyTo,
      subject: generalOptions.subject,
      headers: generalOptions.headers,
      text,
      html,
      attachments: generalOptions.attachments,
      ...handlerOptions,
    })

    return {
      messageID: result.messageId,
      handlerInformation: result,
    }
  }

  internal() {
    return {
      config: this.config,
      transporter: this.transporter,
    }
  }
}
