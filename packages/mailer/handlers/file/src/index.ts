import fs from 'node:fs'
import path from 'node:path'

import { MailHandler } from '@redwoodjs/mailer-core'
import type { CompleteSendOptions, MailTemplate } from '@redwoodjs/mailer-core'
import { MailRenderer } from '@redwoodjs/mailer-core/dist/renderer'
// TODO: ^ Use just /renderer by providing an export in the package.json?

export interface HandlerConfig {
  outputDir: string
}

export interface HandlerOptions {
  subDir?: string
  prefix?: string
}

export class FileMailHandler extends MailHandler {
  constructor(private config: HandlerConfig) {
    super()

    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true })
    }

    if (!fs.statSync(config.outputDir).isDirectory()) {
      throw new Error(
        `Output directory '${config.outputDir}' is not a directory`
      )
    }
  }

  send(
    template: MailTemplate,
    generalOptions: CompleteSendOptions,
    handlerOptions?: HandlerOptions
  ): void {
    // NOTE: 'options.format' should be defined because the Mailer class will default it
    const content = MailRenderer.render(template, generalOptions.format)

    for (const address of [
      ...generalOptions.to,
      ...generalOptions.cc,
      ...generalOptions.bcc,
    ]) {
      // Ensure address is fs safe
      const safeAddress = address.replace(/[^a-z0-9]/gi, '_').toLowerCase()

      // Make the inbox if it doesn't exist
      const inboxDir = path.join(this.config.outputDir, safeAddress)
      if (!fs.existsSync(inboxDir)) {
        fs.mkdirSync(inboxDir, { recursive: true })
      }
      const paths = [inboxDir]
      if (handlerOptions?.subDir) {
        paths.push(handlerOptions.subDir)
      }
      fs.writeFileSync(
        path.join(
          ...paths,
          `${generalOptions.subject}-${Date.now()}.${
            generalOptions.format === 'html' ? 'html' : 'txt'
          }`
        ),
        content
      )
    }
  }

  internal() {
    return {
      config: this.config,
    }
  }
}
