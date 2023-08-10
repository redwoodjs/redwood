import { render as reactEmailRender } from '@react-email/render'

import {
  MailRenderedContent,
  MailUtilities,
  AbstractMailRenderer,
  MailRendererOptions,
} from '@redwoodjs/mailer-core'

export type SupportedOutputFormats = undefined
export type RendererOptions = MailRendererOptions<SupportedOutputFormats> &
  Parameters<typeof reactEmailRender>[1]

export class PrerenderedRenderer extends AbstractMailRenderer {
  render(
    prerenderedContent: {
      html?: string
      text?: string
    },
    _options: RendererOptions,
    _utilities?: MailUtilities
  ): MailRenderedContent {
    return {
      html: prerenderedContent.html ?? '',
      text: prerenderedContent.text ?? '',
    }
  }

  // Nothing interal to expose
  internal(): Record<string, unknown> {
    return {}
  }
}
