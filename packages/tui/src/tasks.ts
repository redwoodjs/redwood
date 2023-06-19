import stream from 'stream'

import boxen from 'boxen'
import chalk from 'chalk'

export interface TUITaskDefinition {
  title: string

  task: ((task: TUITask) => Promise<void>) | TUITaskDefinition[]

  enable?: ((task: TUITask) => Promise<boolean>) | boolean
  skip?: ((task: TUITask) => Promise<boolean>) | boolean
  onError?: (task: TUITask, error: Error) => Promise<void>
}

// can hold arbitrary data for the task
export interface TUITaskContext {
  [key: string]: any
}

export class TUITask {
  //
  title: string

  // the task's index in the list of tasks e.g. 2.3
  index: string

  // flags
  enabled = true
  skipped = false
  errored = false
  completed = false

  // lifecycle functions
  skip: ((task: TUITask) => Promise<boolean>) | boolean
  enable: ((task: TUITask) => Promise<boolean>) | boolean

  task: ((task: TUITask) => Promise<void>) | TUITask[]
  onError: (task: TUITask, error: Error) => Promise<void>

  // context
  context: TUITaskContext = {}

  // state
  state: 'pending' | 'running' | 'completed' | 'skipped' | 'errored' = 'pending'

  // content / rendering
  mode: 'text' | 'stream'
  header: string
  content: string
  private spinner: {
    enabled: boolean
    characters: string[]
  }
  private spinnerIndex = 0
  boxen?: boxen.Options
  limit: number

  private outContent = ''
  private outStream?: stream.Writable
  private errContent = ''
  private errStream?: stream.Writable

  constructor(definition: TUITaskDefinition, index: string) {
    this.index = index

    this.title = definition.title
    this.enable = definition.enable ?? true
    this.skip = definition.skip ?? false
    this.onError =
      definition.onError ??
      (async (task, error) => {
        task.mode = 'text'
        task.header = ''
        task.content = error.stack ?? error.message ?? error.toString()
        task.boxen = {
          padding: 1,
          borderColor: 'red',
          title: `Task ${task.index} Error`,
        }
        task.limit = -1
      })

    // Handle the task definition
    if (typeof definition.task === 'function') {
      this.task = definition.task
    } else if (Array.isArray(definition.task)) {
      this.task = definition.task.map(
        (childTask, childIndex) =>
          new TUITask(childTask, `${index}.${childIndex + 1}`)
      )
    } else {
      throw new Error('Invalid task definition')
    }

    this.mode = 'text'
    this.header = ''
    this.content = ''
    this.spinner = {
      enabled: false,
      characters: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'].map(
        (char) => chalk.hex('#ff845e')(char)
      ),
    }
    this.limit = -1
  }

  // rendering

  renderTitleToString() {
    // show '1' for the root and '1.x.y' for the decendants
    const depth = this.index.split('.').length
    const formattedIndex = depth === 1 ? this.index.split('.')[0] : this.index

    let formattedTitle = `${formattedIndex}: ${this.title}`

    if (this.state === 'running') {
      formattedTitle = `${
        this.spinner.characters[this.spinnerIndex]
      } ${formattedTitle} `
      this.spinnerIndex =
        (this.spinnerIndex + 1) % this.spinner.characters.length
    } else if (this.state === 'completed') {
      formattedTitle = `${chalk.green('✓')} ${formattedTitle}`
    } else if (this.state === 'skipped') {
      formattedTitle = `${chalk.yellow('-')} ${formattedTitle}`
    } else if (this.state === 'errored') {
      formattedTitle = `${chalk.red('✗')} ${formattedTitle}`
    } else if (this.state === 'pending') {
      formattedTitle = `${chalk.gray('⠿')} ${formattedTitle}`
    }

    // Add indentation to account for the task depth
    formattedTitle = `${'  '.repeat(depth - 1)}${formattedTitle}`
    return formattedTitle
  }

  renderBodyToString(): string {
    if (typeof this.task !== 'function') {
      return this.task
        .map((task) =>
          [task.renderTitleToString(), task.renderBodyToString()].join('\n')
        )
        .join('\n')
    }

    // Text content
    let renderedString = this.content

    // Stream content
    if (this.mode === 'stream') {
      renderedString = this.outContent || chalk.dim('No output yet...')
    }

    // Add the header if it exists
    if (this.header) {
      renderedString = `${this.header}\n${renderedString}`
    }

    // Add a spinner if enabled
    if (this.spinner.enabled) {
      renderedString = `${
        this.spinner.characters[this.spinnerIndex]
      } ${renderedString}`

      // Increment the spinner index and reset if necessary
      this.spinnerIndex =
        (this.spinnerIndex + 1) % this.spinner.characters.length
    }

    // Remove trailing whitespace
    renderedString = renderedString.trimEnd()

    // Boxen
    if (this.boxen) {
      // Compute the line length we can use within the boxen
      let unavailableColumns = 4 // 2 for the border characters themselves, 2 from newline(?)
      if (this.boxen.padding !== undefined) {
        if (typeof this.boxen.padding === 'number') {
          unavailableColumns += this.boxen.padding * 6
        } else {
          unavailableColumns += this.boxen.padding.left ?? 0
          unavailableColumns += this.boxen.padding.right ?? 0
        }
      }
      if (this.boxen.margin !== undefined) {
        if (typeof this.boxen.margin === 'number') {
          unavailableColumns += this.boxen.margin * 6
        } else {
          unavailableColumns += this.boxen.margin.left ?? 0
          unavailableColumns += this.boxen.margin.right ?? 0
        }
      }
      // TODO: Make this depend on the tui output stream
      const availableColumns = process.stdout.columns - unavailableColumns

      // We wrap the text to ensure it fits in the boxen
      renderedString = renderedString
        .split('\n')
        .map((line) => {
          if (line.length > availableColumns) {
            const splitLines: string[] = []
            const chunkCount = Math.ceil(line.length / availableColumns)
            for (let i = 0; i < chunkCount; i++) {
              splitLines.push(
                line.slice(i * availableColumns, (i + 1) * availableColumns)
              )
            }
            return splitLines.join('\n')
          }
          return line
        })
        .join('\n')
    }

    // Enforce a limit on the number of lines
    if (this.limit > 0) {
      const lines = renderedString.split('\n')
      if (lines.length > this.limit) {
        renderedString = lines
          .slice(lines.length - this.limit, lines.length)
          .join('\n')
      }
    }

    if (this.boxen) {
      // TODO: Force width to fill the terminal?
      renderedString = boxen(renderedString, this.boxen)
    }

    if (this.limit === 0) {
      return ''
    }
    return renderedString
  }

  renderToString(): string {
    if (typeof this.task === 'function') {
      return `${this.renderTitleToString()}\n${this.renderBodyToString()}`.trimEnd()
    }
    let content = `${this.renderTitleToString()}\n`
    for (const childTask of this.task) {
      content += `${childTask.renderToString()}\n`
    }
    return content.trimEnd()
  }

  // lifecycle

  async run() {
    this.enabled =
      typeof this.enable === 'function' ? await this.enable(this) : this.enable
    if (!this.enabled) {
      return true
    }

    this.skipped =
      typeof this.skip === 'function' ? await this.skip(this) : this.skip
    if (this.skipped) {
      this.state = 'skipped'
      return true
    }

    try {
      this.state = 'running'
      if (typeof this.task === 'function') {
        await this.task(this)
      } else if (Array.isArray(this.task)) {
        // Run the child tasks
        for (const childTask of this.task) {
          if (!(await childTask.run())) {
            this.errored = true
            this.state = 'errored'
            // await this.onError(this, error as Error)
            return false
          }
        }
      }
      this.mode = 'text'
      this.header = ''
      this.content = ''
      this.boxen = undefined
      this.completed = true
      this.state = 'completed'
      return true
    } catch (error) {
      this.errored = true
      this.state = 'errored'
      await this.onError(this, error as Error)
      return false
    }
  }

  // helpers

  // TODO: Type this better. Might result in an execa dependency? Can probably jut dev dep on types though
  streamFromExeca(
    execa: any,
    options: { boxen?: boxen.Options; limit?: number } = {}
  ) {
    // Stdout
    this.outStream = new stream.Writable({
      write: (chunk: Buffer, _encoding, next) => {
        if (this.mode === 'stream') {
          this.outContent += chunk.toString('utf-8')
        }
        next()
      },
    })
    this.outContent = ''
    execa.stdout.pipe(this.outStream, { end: true })

    // Stderr
    this.errStream = new stream.Writable({
      write: (chunk: Buffer, _encoding, next) => {
        if (this.mode === 'stream') {
          this.errContent += chunk.toString('utf-8')
        }
        next()
      },
    })
    this.errContent = ''
    execa.stderr.pipe(this.errStream, { end: true })

    // Set the render options
    this.mode = 'stream'
    this.boxen = { padding: 1, ...options.boxen }
    this.limit = options.limit ?? 5
  }
}
