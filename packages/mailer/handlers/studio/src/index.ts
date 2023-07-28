import { MailHandler } from '@redwoodjs/mailer-core'
import type {
  CompleteSendOptions,
  MailResult,
  MailTemplate,
} from '@redwoodjs/mailer-core'
import { NodemailerMailHandler } from '@redwoodjs/mailer-handler-nodemailer'
import type { HandlerOptions } from '@redwoodjs/mailer-handler-nodemailer'

export class StudioMailHandler extends MailHandler {
  private nodemailerHandler: NodemailerMailHandler

  constructor() {
    super()

    this.nodemailerHandler = new NodemailerMailHandler({
      transport: {
        host: 'localhost',
        port: 4319,
        secure: false,
      },
    })
  }

  async send(
    template: MailTemplate,
    generalOptions: CompleteSendOptions,
    handlerOptions?: HandlerOptions
  ): Promise<MailResult> {
    return this.nodemailerHandler.send(template, generalOptions, handlerOptions)
  }

  internal() {
    return {
      nodemailerHandler: this.nodemailerHandler,
    }
  }
}
