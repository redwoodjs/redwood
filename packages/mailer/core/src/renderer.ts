import type {
  MailUtilities,
  MailRenderedContent,
  MailRendererOptions,
} from './types'

export abstract class AbstractMailRenderer {
  abstract render(
    template: unknown,
    options: MailRendererOptions<unknown>,
    utilities?: MailUtilities
  ): MailRenderedContent

  // Provide access to handler specific properties
  abstract internal(): Record<string, unknown>
}
