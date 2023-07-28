import type { Logger } from '@redwoodjs/api/logger'

import type { MailHandler } from './handler'

export type MailHandlers = Record<string, MailHandler>

export type MailerRenderFormat = 'text' | 'html' | 'both'

// Basically one of or both of text and html
export type MailerRenderResult =
  | { text: string; html?: string }
  | { text?: string; html: string }
  | { text: string; html: string }

export interface MailerConfig<THandlers, TDefault> {
  logger?: Logger

  defaultHandler: TDefault
  defaultFrom: string
  defaultRenderFormat?: MailerRenderFormat

  isDev?: boolean | ((...args: any[]) => boolean)
  devHandler?: keyof THandlers

  isTest?: boolean | ((...args: any[]) => boolean)
  testHandler?: keyof THandlers

  // TODO:
  // - retry count
  // - fallback provider(s)
  // - audit trail feature?
  // - additional defaults (e.g. headers)
}

export interface MailerSendOptions<THandlers, U extends keyof THandlers> {
  handler?: U | keyof THandlers

  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]

  from?: string
  replyTo?: string

  subject: string

  format?: MailerRenderFormat

  headers?: Record<string, string>

  attachments?: MailAttachment[]
}

export type MailAttachment = {
  filename?: string
  path?: string
  content?: string | Buffer
}

// This is easier to work with inside providers whereas SendOptions is better for parameters to user facing functions
export type CompleteSendOptions = {
  to: string[]
  cc: string[]
  bcc: string[]

  from: string
  replyTo?: string

  subject: string

  format: MailerRenderFormat

  headers: Record<string, string>

  attachments: MailAttachment[]
}

export type MailResult = {
  messageID?: string
  handlerInformation?: unknown
}

export type MailHandlerUtilities = {
  logger?: Logger | Console
}

// Derived from the react-email render utility
export type MailTemplate = React.ReactElement<
  any,
  string | React.JSXElementConstructor<any>
>
