import { render as reactEmailRender } from '@react-email/render'

import { MailerRenderFormat, MailTemplate } from '../types'

export class MailRenderer {
  private constructor() {}

  static render(template: MailTemplate, format: MailerRenderFormat) {
    return reactEmailRender(template, {
      plainText: format === 'text',
      pretty: true,
    })
  }
}
