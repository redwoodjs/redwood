import { render as reactEmailRender } from '@react-email/render'

import type {
  MailTemplate,
  MailerRenderFormat,
  MailerRenderResult,
} from '../types'

export class MailRenderer {
  private constructor() {}

  static render(
    template: MailTemplate,
    format: MailerRenderFormat
  ): MailerRenderResult {
    const html =
      format === 'both' || format === 'html'
        ? reactEmailRender(template, {
            plainText: false,
            pretty: true,
          })
        : undefined

    const text =
      format === 'both' || format === 'text'
        ? reactEmailRender(template, {
            plainText: true,
            pretty: true,
          })
        : undefined

    // In theory this should never happen
    if (html === undefined && text === undefined) {
      throw new Error('Unable to render email')
    }

    return {
      text,
      html,
    } as MailerRenderResult
  }
}
