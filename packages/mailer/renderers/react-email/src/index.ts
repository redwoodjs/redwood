import { render as reactEmailRender } from '@react-email/render'

import {
  MailRenderedContent,
  MailUtilities,
  AbstractMailRenderer,
  MailRendererOptions,
} from '@redwoodjs/mailer-core'

export type SupportedOutputFormats = 'both' | 'html' | 'text'
export type RendererOptions = MailRendererOptions<SupportedOutputFormats> &
  Parameters<typeof reactEmailRender>[1]

export class ReactEmailRenderer extends AbstractMailRenderer {
  render(
    template: Parameters<typeof reactEmailRender>[0],
    options: RendererOptions,
    _utilities?: MailUtilities
  ): MailRenderedContent {
    const outputFormat = options.outputFormat ?? 'both'
    const renderHTML = outputFormat === 'both' || outputFormat === 'html'
    const renderText = outputFormat === 'both' || outputFormat === 'text'
    return {
      html: renderHTML
        ? reactEmailRender(template, {
            pretty: true,
            plainText: false,
            ...options,
          })
        : '',
      text: renderText
        ? reactEmailRender(template, {
            pretty: true,
            plainText: true,
            ...options,
          })
        : '',
    }
  }

  // Nothing interal to expose
  internal(): Record<string, unknown> {
    return {}
  }
}
