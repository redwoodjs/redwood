import type {
  MailSendOptionsComplete,
  MailResult,
  MailUtilities,
  MailRenderedContent,
} from './types'

export type HandlerUtilities = {
  rendererOptions?: unknown
}

export abstract class AbstractMailHandler {
  // Send a mail
  abstract send(
    renderedContent: MailRenderedContent,
    sendOptions: MailSendOptionsComplete,
    handlerOptions?: unknown,
    utilities?: MailUtilities & HandlerUtilities
  ): Promise<MailResult> | MailResult

  // Provide access to handler specific properties
  abstract internal(): Record<string, unknown>
}
