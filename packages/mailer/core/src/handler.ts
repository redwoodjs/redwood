import type {
  MailTemplate,
  CompleteSendOptions,
  MailResult,
  MailHandlerUtilities,
} from './types'

export abstract class MailHandler {
  // Send a mail
  abstract send(
    template: MailTemplate,
    generalOptions: CompleteSendOptions,
    handlerOptions?: unknown,
    utilities?: MailHandlerUtilities
  ): Promise<MailResult> | MailResult

  // Provide access to provider specific properties
  abstract internal(): Record<string, unknown>
}
