import type { MailHandler } from './handler'

export type MailHandlers = Record<string, MailHandler>

export type MailerRenderFormat = 'text' | 'html'

export interface MailerConfig<THandlers> {
  defaultHandler: THandlers
  defaultFrom: string

  defaultRenderFormat?: MailerRenderFormat

  // TODO:
  // - default from
  // - retry count
  // - fallback provider(s)
  // - logger
  // - auditer
  // - webhook(s?)
}

export interface MailerSendOptions<THandlers, U extends keyof THandlers> {
  handler?: U | keyof THandlers

  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]

  from?: string

  subject: string

  format?: MailerRenderFormat

  headers?: Record<string, string>
}

// TODO: Attachments
//       - embedded images
// TODO: Calendar event
// TODO: Headers
//       - List headers
export type SendOptions = {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]

  from?: string

  subject: string

  format?: MailerRenderFormat

  headers?: Record<string, string>
}

// This is easier to work with inside providers whereas SendOptions is better for parameters to user facing functions
export type CompleteSendOptions = {
  to: string[]
  cc: string[]
  bcc: string[]

  from: string

  subject: string

  format: MailerRenderFormat

  headers: Record<string, string>
}

// Derived from the react-email render utility
export type MailTemplate = React.ReactElement<
  any,
  string | React.JSXElementConstructor<any>
>
