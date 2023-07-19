import type { MailerSendOptionsDefaulted, MailerTemplateType } from './types'

export abstract class MailProvider {
  constructor() {}

  // Send a mail
  abstract send(
    template: MailerTemplateType,
    options: MailerSendOptionsDefaulted,
    providerOptions?: unknown
  ): void

  // Expose provider specific implementation
  abstract exposed(): Record<string, unknown>
}
