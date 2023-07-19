import { render as reactEmailRender } from '@react-email/render'

import { MailerRenderFormat, MailerTemplateType } from '../types'

export class MailRenderer {
  private constructor() {}

  static render(template: MailerTemplateType, format: MailerRenderFormat) {
    return reactEmailRender(template, {
      plainText: format === 'text',
      pretty: true,
    })
  }
}
