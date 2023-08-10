import type { Logger } from '@redwoodjs/api/logger'

import type { AbstractMailHandler } from './handler'
import type { AbstractMailRenderer } from './renderer'

export type MailRenderedContent = {
  html: string
  text: string
}

export type MailHandlers = Record<string, AbstractMailHandler>
export type MailRenderers = Record<string, AbstractMailRenderer>

export type MailRendererOptions<TRenderOutputFormats> = {
  outputFormat?: TRenderOutputFormats
  [key: string]: unknown
}

// Basically one of or both of text  and html
export type MailRenderResult =
  | { text: string; html?: string }
  | { text?: string; html: string }
  | { text: string; html: string }

export type DefaultHandlerOptions<THandlers extends MailHandlers> = {
  [K in keyof THandlers]?: Parameters<THandlers[K]['send']>[2]
}

export type DefaultRendererOptions<TRenderers extends MailRenderers> = {
  [K in keyof TRenderers]?: Parameters<TRenderers[K]['render']>[1]
}

export type DefaultSendOptions = {
  attachments: MailAttachment[]
  bcc: string[]
  cc: string[]
  from: string
  headers: Record<string, string>
  replyTo: string
}

export type MailHandlersOptions<
  THandlers extends MailHandlers,
  TDefaultHandler
> = {
  handlers: THandlers
  default: TDefaultHandler | keyof THandlers
  options: DefaultHandlerOptions<THandlers>
}

export type MailRenderersOptions<
  TRenderers extends MailRenderers,
  TDefaultRenderer
> = {
  renderers: TRenderers
  default: TDefaultRenderer | keyof TRenderers
  options: DefaultRendererOptions<TRenderers>
}

export interface MailerConfig<
  THandlers extends MailHandlers,
  TDefaultHandler extends keyof THandlers,
  TRenderers extends MailRenderers,
  TDefaultRenderer extends keyof TRenderers,
  TTestHandler extends keyof THandlers,
  TDevelopmentHandler extends keyof THandlers
> {
  handling: MailHandlersOptions<THandlers, TDefaultHandler>
  rendering: MailRenderersOptions<TRenderers, TDefaultRenderer>

  defaults?: Partial<DefaultSendOptions>

  isDevelopment?: boolean | ((...args: any[]) => boolean)
  developmentHandler?: TDevelopmentHandler

  isTest?: boolean | ((...args: any[]) => boolean)
  testHandler?: TTestHandler

  logger?: Logger
}

export type MailAddress = string | { name?: string; address: string }

export interface MailSendOptions<
  THandlers,
  THandler extends keyof THandlers,
  TRenderers,
  TRenderer extends keyof TRenderers
> {
  renderer?: TRenderer | keyof TRenderers
  handler?: THandler | keyof THandlers

  to: MailAddress | MailAddress[]
  cc?: MailAddress | MailAddress[]
  bcc?: MailAddress | MailAddress[]

  from?: MailAddress
  replyTo?: MailAddress

  subject: string

  headers?: Record<string, string>

  attachments?: MailAttachment[]
}

export type MailAttachment = {
  filename?: string
  path?: string
  content?: string | Buffer
}

// This is easier to work with inside providers whereas SendOptions is better for parameters to user facing functions
export type MailSendOptionsComplete = {
  renderer: string | number | symbol
  handler: string | number | symbol

  to: string[]
  cc: string[]
  bcc: string[]

  from: string
  replyTo?: string

  subject: string

  headers: Record<string, string>

  attachments: MailAttachment[]
}

export type MailResult = {
  messageID?: string
  handlerInformation?: unknown
}

export type MailUtilities = {
  logger?: Logger | Console
}
