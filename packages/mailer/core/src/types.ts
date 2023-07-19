export type MailerRenderFormat = 'text' | 'html'

export interface MailerConfig {
  defaultProvider: string
  defaultFormat: MailerRenderFormat
}

// TODO: Attachments
//       - embedded images
// TODO: Calendar event
// TODO: Headers
//       - List headers
export interface MailerSendOptions {
  provider?: string

  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]

  from?: string

  subject: string

  format?: MailerRenderFormat

  headers?: Record<string, string>
}

export type MailerSendOptionsDefaulted = Required<MailerSendOptions>

export type MailerTemplateType = React.ReactElement<
  any,
  string | React.JSXElementConstructor<any>
>
