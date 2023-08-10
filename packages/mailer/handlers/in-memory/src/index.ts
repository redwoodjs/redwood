import {
  MailSendOptionsComplete,
  AbstractMailHandler,
  MailUtilities,
  MailRenderedContent,
  MailResult,
  HandlerUtilities,
} from '@redwoodjs/mailer-core'

export type InMemoryMail = {
  renderedText: MailRenderedContent['text']
  renderedHTML: MailRenderedContent['html']
  handlerOptions?: unknown
  rendererOptions?: unknown
} & Omit<MailSendOptionsComplete, 'text' | 'html'>

export class InMemoryMailHandler extends AbstractMailHandler {
  public inbox: InMemoryMail[]

  constructor() {
    super()
    this.inbox = []
  }

  send(
    renderedContent: MailRenderedContent,
    sendOptions: MailSendOptionsComplete,
    handlerOptions?: never,
    utilities?: MailUtilities & HandlerUtilities
  ): MailResult | Promise<MailResult> {
    this.inbox.push({
      ...sendOptions,
      renderedText: renderedContent.text,
      renderedHTML: renderedContent.html,
      handlerOptions,
      rendererOptions: utilities?.rendererOptions,
    })

    return {
      messageID: `in-memory-${this.inbox.length}`,
    }
  }

  internal(): Record<string, unknown> {
    return {
      inbox: this.inbox,
    }
  }

  clearInbox() {
    this.inbox = []
  }
}
