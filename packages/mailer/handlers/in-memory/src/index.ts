import { v4 as uuidv4 } from 'uuid'

import { MailHandler } from '@redwoodjs/mailer-core'
import type {
  CompleteSendOptions,
  MailResult,
  MailTemplate,
} from '@redwoodjs/mailer-core'
import { MailRenderer } from '@redwoodjs/mailer-core/dist/renderer'

export interface HandlerConfig {}

export interface HandlerOptions {}

type InMemoryMail = {
  template: MailTemplate
  generalOptions: CompleteSendOptions
  handlerOptions?: HandlerOptions
  content: ReturnType<(typeof MailRenderer)['render']>
}

export class InMemoryMailHandler extends MailHandler {
  private inbox: InMemoryMail[]

  constructor(private config?: HandlerConfig) {
    super()

    this.inbox = []
  }

  send(
    template: MailTemplate,
    generalOptions: CompleteSendOptions,
    handlerOptions?: HandlerOptions
  ): MailResult {
    // NOTE: 'options.format' should be defined because the Mailer class will default it
    const content = MailRenderer.render(template, generalOptions.format)

    this.inbox.push({
      template,
      generalOptions,
      handlerOptions,
      content,
    })

    return {
      messageID: `${uuidv4()}@in.memory.example.com`,
    }
  }

  internal() {
    return {
      config: this.config,
      inbox: this.inbox,
    }
  }
}
