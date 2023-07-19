import { v4 as uuidv4 } from 'uuid'

import { MailProvider } from '@redwoodjs/mailer-core'
import type {
  MailerSendOptionsDefaulted,
  MailerTemplateType,
} from '@redwoodjs/mailer-core'
// TODO: Use just /renderer by providing an export in the package.json
import { MailRenderer } from '@redwoodjs/mailer-core/dist/renderer'

export class InMemoryMailProvider extends MailProvider {
  // The collection of emails sent by this provider
  private mails: Map<string, { status: any; content: string }> = new Map()

  constructor() {
    super()
  }

  async send(
    template: MailerTemplateType,
    options: MailerSendOptionsDefaulted
  ): Promise<void> {
    const content = MailRenderer.render(template, options.format)
    const reference = uuidv4()

    // Add the email to the collection
    this.mails.set(reference, { status: 'sent', content })

    // return { reference } or something more concrete in the future when I'm aware of the shape of the response from various providers
  }

  exposed(): Record<string, unknown> {
    return {
      mails: this.mails,
    }
  }
}
