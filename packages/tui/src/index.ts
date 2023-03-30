//

import stream from 'stream'

import boxen from 'boxen'
import chalk from 'chalk'
import { prompt as enquirerPrompt } from 'enquirer'
import { UpdateManager } from 'stdout-update'

/**
 * Specifications:
 * - Prompting support
 * - A basic progress bar
 * - Templates for common tasks, printing errors etc.
 */

export interface RedwoodTUIConfig {
  out?: NodeJS.WriteStream
  err?: NodeJS.WriteStream
}

export interface RedwoodTUIHeaderOptions {
  spinner: boolean
  spinnerIndex: number
  spinnerCharacters: string[]
}

/**
 * To keep a consistent color/style palette between cli packages, such as
 * @redwood/create-redwood-app and @redwood/cli, please keep them compatible
 * with one and another. We'll might split up and refactor these into a
 * separate package when there is a strong motivation behind it.
 *
 * Current files:
 *
 * - packages/cli/src/lib/colors.js
 * - packages/create-redwood-app/src/create-redwood-app.js (this file)
 *
 */
export const styling = {
  error: chalk.bold.red,
  warning: chalk.keyword('orange'),
  success: chalk.greenBright,
  info: chalk.grey,

  header: chalk.bold.underline.hex('#e8e8e8'),
  cmd: chalk.hex('#808080'),
  redwood: chalk.hex('#ff845e'),
  love: chalk.redBright,

  green: chalk.green,
}

/**
 * TODO: Documentation for this
 */
export class RedwoodTUI {
  private manager: UpdateManager

  private timerId?: NodeJS.Timer
  private looping = false

  private header?: string
  private headerOptions = {
    spinner: false,
    spinnerIndex: 0,
    spinnerCharacters: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  }

  private boxen?: boxen.Options

  private contentText = ''
  private contentMode: 'text' | 'stream' = 'text'

  private outStream?: stream.Writable
  private errStream?: stream.Writable

  constructor({ out, err }: RedwoodTUIConfig = {}) {
    this.manager = UpdateManager.getInstance(out, err)
  }

  /**
   * Enable control of the terminal and allow writing content
   */
  enable() {
    if (!this.manager.isHooked) {
      this.manager.hook()
      this.looping = true
      this.timerId = setInterval(() => {
        this.loop()
      }, 80)
    }
  }

  /**
   * Disable control of the terminal and stop writing content
   */
  disable() {
    if (this.manager.isHooked) {
      // Stop the draw loop
      this.looping = false
      clearInterval(this.timerId)

      // Draw one last time
      this.loop(true)

      this.outStream?.destroy()
      this.errStream?.destroy()
      this.manager.unhook()
    }
  }

  /**
   * The draw loop
   */
  loop(force = false) {
    if (this.looping || force) {
      const builtContent = this.buildContent()
      const content: string[] = []
      if (this.boxen) {
        content.push(...boxen(builtContent || '', this.boxen).split('\n'))
      } else {
        if (this.header) {
          if (this.headerOptions.spinner) {
            content.push(
              `${
                this.headerOptions.spinnerCharacters[
                  this.headerOptions.spinnerIndex
                ]
              } ${this.header}`
            )
            this.headerOptions.spinnerIndex += 1
            this.headerOptions.spinnerIndex =
              this.headerOptions.spinnerIndex %
              this.headerOptions.spinnerCharacters.length
          } else {
            content.push(this.header)
          }
        }
        if (builtContent) {
          content.push(builtContent)
        }
      }
      this.manager.update(content)
    }
  }

  /**
   * TODO: This should be used to prevent overriding all of the history, like move on to a newline and update any new content
   */
  moveOn() {
    // If needed redraw to remove artifacts like spinners
    if (this.header) {
      this.setHeader(this.header, { spinner: false })
      this.loop(true)
    }

    // Disable
    this.disable()

    // Clear any previously defined content and settings
    this.contentText = ''
    this.contentMode = 'text'
    this.clearHeader()
    this.clearBoxen()

    // Re-enable
    this.enable()
  }

  buildContent(): string {
    const content: string[] = []
    switch (this.contentMode) {
      case 'text':
        if (this.contentText) {
          content.push(this.contentText)
        }
        break
      case 'stream':
        if (this.contentText) {
          content.push(this.contentText)
        }
        break
    }
    return content.join('\n')
  }

  // ---

  setHeader(header: string, options?: Partial<RedwoodTUIHeaderOptions>) {
    this.header = header
    this.headerOptions = { ...this.headerOptions, ...options }
  }

  clearHeader() {
    this.header = undefined
  }

  // ---

  setBoxen(options: boxen.Options) {
    this.boxen = options
  }

  clearBoxen() {
    this.boxen = undefined
  }

  // ---

  setContent(text: string) {
    this.contentText = text
  }

  setContentMode(mode: 'text' | 'stream') {
    this.contentMode = mode
  }

  // ---

  setOutStream(out: stream.Readable) {
    this.outStream = new stream.Writable({
      write: (chunk: Buffer, _encoding, next) => {
        if (this.contentMode === 'stream') {
          this.contentText += chunk.toString('utf-8')
        }
        next()
        return true
      },
    })
    out.pipe(this.outStream, { end: true })
  }

  setErrStream(err: stream.Readable) {
    this.errStream = new stream.Writable({
      write: (_chunk, _encoding, _next) => {
        // if(this.contentMode === "stream"){
        // this.contentText += chunk
        // }
        return true
      },
    })
    err.pipe(this.errStream, { end: true })
  }

  // ---

  drawLinesAndMoveOn(...lines: string[]) {
    lines.forEach((line) => {
      this.setContentMode('text')
      this.setContent(line)
      this.loop(true)
      this.moveOn()
    })
  }

  // ---

  promptA = enquirerPrompt

  // TODO: Fix types of questions, enquirer does not export their types...
  async prompt<T = object>(questions: any): Promise<T> {
    this.moveOn()
    this.disable()
    const result = await enquirerPrompt<T>(questions)
    this.enable()
    return result
  }

  // ---

  displayError(title: string, message: string) {
    this.moveOn()
    this.setBoxen({
      padding: 1,
      borderColor: 'red',
      title: `⚠ Error: ${title}`,
      titleAlignment: 'left',
    })
    this.setContentMode('text')
    this.setContent(message)
    this.moveOn()
  }

  // ---
}
