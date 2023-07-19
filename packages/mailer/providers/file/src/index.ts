import fs from 'node:fs'
import path from 'node:path'

import { MailProvider } from '@redwoodjs/mailer-core'
import type { MailerSendOptions } from '@redwoodjs/mailer-core'
// TODO: Use just /renderer by providing an export in the package.json
import { MailRenderer } from '@redwoodjs/mailer-core/dist/renderer'

export interface FileMailProviderConfig {
  outputDir: string
}

export class FileMailProvider extends MailProvider {
  constructor(private config: FileMailProviderConfig) {
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

  send(template: any, options: MailerSendOptions): void {
    const to = Array.isArray(options.to) ? options.to : [options.to]
    const cc =
      options.cc === undefined
        ? []
        : Array.isArray(options.cc)
        ? options.cc
        : [options.cc]
    const bcc =
      options.bcc === undefined
        ? []
        : Array.isArray(options.bcc)
        ? options.bcc
        : [options.bcc]

    const subject = options.subject

    // NOTE: 'options.format' should be defined because the Mailer class will default it
    const format = options.format ?? 'html'
    const content = MailRenderer.render(template, format)

    for (const address of [...to, ...cc, ...bcc]) {
      // Ensure address is fs safe
      const safeAddress = address.replace(/[^a-z0-9]/gi, '_').toLowerCase()

      // Make the inbox if it doesn't exist
      const inboxDir = path.join(this.config.outputDir, safeAddress)
      if (!fs.existsSync(inboxDir)) {
        fs.mkdirSync(inboxDir, { recursive: true })
      }
      fs.writeFileSync(
        path.join(
          inboxDir,
          `${subject}-${Date.now()}.${format === 'html' ? 'html' : 'txt'}`
        ),
        content
      )
    }
  }

  exposed(): Record<string, unknown> {
    return {
      config: this.config,
    }
  }
}
