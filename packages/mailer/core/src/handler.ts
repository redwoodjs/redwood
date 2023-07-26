import type { MailTemplate, CompleteSendOptions } from './types'

export abstract class MailHandler {
  // Send a mail
  abstract send(
    template: MailTemplate,
    generalOptions: CompleteSendOptions,
    handlerOptions?: unknown
  ): Promise<void> | void

  // Provide access to provider specific properties
  abstract internal(): Record<string, unknown>
}
