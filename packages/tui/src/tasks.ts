import stream from 'stream'

import ansiEscapes from 'ansi-escapes'
import boxen from 'boxen'
import chalk from 'chalk'

// There constants are needed for alternate screen mode
// Note: These are available in newer versions of ansi-escapes that we do not yet use
// See: https://github.com/sindresorhus/ansi-escapes/blob/7f7c97a4b34ff1f0b9b44b768b82755d8df98b50/index.js#L100-L101
const ENTER_ALT_SCREEN = '\u001B[?1049h'
const EXIT_ALT_SCREEN = '\u001B[?1049l'

type TUITaskFunction =
  | ((task: TUITask) => Promise<void>)
  | ((task: TUITask) => void)

type TUIErrorFunction =
  | ((task: TUITask, error: Error) => Promise<void>)
  | ((task: TUITask, error: Error) => void)

type TUIToggleFunction =
  | ((task: TUITask) => Promise<boolean>)
  | ((task: TUITask) => boolean)

export interface TUITaskDefinition {
  title: string

  task: TUITaskFunction | TUITaskDefinition[]

  enable?: TUIToggleFunction | boolean
  skip?: TUIToggleFunction | boolean

  onError?: TUIErrorFunction
  onComplete?: TUITaskFunction
}

// can hold arbitrary data for the task
export interface TUITaskContext {
  [key: string]: any
}

export class TUITask {
  // === Static Properties ===

  static renderingTimerId?: NodeJS.Timer
  static readonly SPINNER_CHARACTERS = [
    '⠋',
    '⠙',
    '⠹',
    '⠸',
    '⠼',
    '⠴',
    '⠦',
    '⠧',
    '⠇',
    '⠏',
  ].map((char) => chalk.hex('#ff845e')(char))

  // === Instance Properties ===

  // the task's title e.g. 'Install dependencies'
  readonly title: string

  // the task's index in the list of tasks e.g. 2.3
  readonly index: string

  // lifecycle functions
  skip: TUIToggleFunction | boolean
  enable: TUIToggleFunction | boolean

  task: TUITaskFunction | TUITask[]

  onError: TUIErrorFunction
  onComplete: TUITaskFunction

  // context
  context: TUITaskContext = {}

  // state
  state:
    | 'pending'
    | 'disabled'
    | 'skipped'
    | 'running'
    | 'completed'
    | 'errored' = 'pending'

  // content / rendering
  mode: 'text' | 'stream'
  header: string
  content: string
  spinner: boolean
  boxen?: boxen.Options
  limit: number

  private spinnerIndex = 0

  private outContent = ''
  private outStream?: stream.Writable
  private errContent = ''
  private errStream?: stream.Writable

  // === Instance Methods ===

  constructor(definition: TUITaskDefinition, index: string) {
    this.index = index

    this.title = definition.title

    this.enable = definition.enable ?? true
    this.skip = definition.skip ?? false

    this.onError =
      definition.onError ??
      ((task, error) => {
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
    this.onComplete = definition.onComplete ?? (async () => {})

    if (typeof definition.task === 'function') {
      this.task = definition.task
    } else {
      this.task = definition.task.map(
        (childTask, childIndex) =>
          new TUITask(childTask, `${index}.${childIndex + 1}`)
      )
    }

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

    // Set the initial rendering options
    this.mode = 'text'
    this.header = ''
    this.content = ''
    this.spinner = false
    this.boxen = undefined
    this.limit = -1
  }

  resetRenderOptions() {
    this.mode = 'text'
    this.header = ''
    this.content = ''
    this.spinner = false
    this.boxen = undefined
    this.limit = -1
  }

  renderTitleToString() {
    const depth = this.index.split('.').length

    // show '1' for the root and '1.x.y' for the decendants
    const formattedIndex = depth === 1 ? this.index.split('.')[0] : this.index

    let prefixIcon: string
    switch (this.state) {
      case 'completed':
        prefixIcon = chalk.green('✓')
        break
      case 'errored':
        prefixIcon = chalk.red('✗')
        break
      case 'skipped':
        prefixIcon = chalk.yellow('-')
        break
      case 'pending':
        prefixIcon = chalk.gray('⠿')
        break
      case 'running':
        prefixIcon = TUITask.SPINNER_CHARACTERS[this.spinnerIndex]
        this.spinnerIndex =
          (this.spinnerIndex + 1) % TUITask.SPINNER_CHARACTERS.length
        break
      case 'disabled':
        prefixIcon = chalk.bgWhite.black('X')
        break
      default:
        prefixIcon = chalk.bgWhite.black('?')
        break
    }

    const indentation = '  '.repeat(depth - 1)
    return `${indentation}${prefixIcon} ${formattedIndex} ${this.title}`
  }

  renderBodyToString(): string {
    // Parent tasks don't have a body
    if (typeof this.task !== 'function') {
      return ''
    }

    // Don't render anything if the limit is 0
    if (this.limit === 0) {
      return ''
    }

    // Get content based on mode
    let renderedString: string
    switch (this.mode) {
      case 'text':
        renderedString = this.content
        break
      case 'stream':
        renderedString =
          this.outContent || chalk.italic.dim('Waiting for content...')
        break
      default:
        renderedString = chalk.bgWhite.black(
          `Task in unknown mode: '${this.mode}'`
        )
    }

    // Add the header if it exists
    if (this.header) {
      renderedString = `${this.header}\n${renderedString}`
    }

    // Add the spinner if enabled
    if (this.spinner) {
      renderedString = `${
        TUITask.SPINNER_CHARACTERS[this.spinnerIndex]
      } ${renderedString}`
      this.spinnerIndex =
        (this.spinnerIndex + 1) % TUITask.SPINNER_CHARACTERS.length
    }

    // Boxen line wrapping
    if (this.boxen) {
      // Compute the line length we can use within the boxen
      let unavailableColumns = 4 // 2 for the border characters themselves, 2 from newline (I think)
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
      const availableColumns = process.stdout.columns - unavailableColumns

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

    // Remove any trailing whitespace
    renderedString = renderedString.trimEnd()

    // Enforce a limit on the number of lines
    if (this.limit > 0) {
      const lines = renderedString.split('\n')
      if (lines.length > this.limit) {
        renderedString = lines
          .slice(lines.length - this.limit, lines.length)
          .join('\n')
      }
    }

    // Add the boxen if enabled
    if (this.boxen) {
      // TODO: Force width to fill the terminal (Available automatically in newer versions of boxen)
      renderedString = boxen(renderedString, this.boxen)
    }

    return renderedString
  }

  renderToString(): string {
    // Render the title and body
    if (typeof this.task === 'function') {
      return `${this.renderTitleToString()}\n${this.renderBodyToString()}`.trimEnd()
    }

    // Render the title and all children
    let content = `${this.renderTitleToString()}\n`
    for (const childTask of this.task) {
      content += `${childTask.renderToString()}\n`
    }
    return content.trimEnd()
  }

  updateStatesOfChildren() {
    if (typeof this.task !== 'function') {
      for (const childTask of this.task) {
        switch (this.state) {
          case 'disabled':
            childTask.state = 'disabled'
            break
          case 'skipped':
            childTask.state = 'skipped'
            break
        }
        childTask.updateStatesOfChildren()
      }
    }
  }

  async run() {
    // Check enable condition
    const enabled =
      typeof this.enable === 'function' ? await this.enable(this) : this.enable
    if (!enabled) {
      this.state = 'disabled'
      this.updateStatesOfChildren()
      return
    }

    // Check skip condition
    const skipped =
      typeof this.skip === 'function' ? await this.skip(this) : this.skip
    if (skipped) {
      this.state = 'skipped'
      this.updateStatesOfChildren()
      return
    }

    // Run the task or the child tasks
    this.state = 'running'
    if (typeof this.task !== 'function') {
      for (const childTask of this.task) {
        await childTask.run()
        if (childTask.state === 'errored') {
          this.state = 'errored'
          return
        }
      }
      this.state = 'completed'
    } else {
      try {
        await this.task(this)
        this.state = 'completed'
      } catch (error) {
        this.state = 'errored'
        await this.onError(this, error as Error)
        return
      }
    }
    if (this.state === 'completed') {
      await this.onComplete(this)
    }

    this.resetRenderOptions()
  }

  // TODO: Type this better. Can probably just dev dep on execa for types?
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

  // === Static Methods ===

  static async run(taskDefinitions: TUITaskDefinition[]) {
    // Build the task objects

    const tasks: TUITask[] = []
    for (let i = 0; i < taskDefinitions.length; i++) {
      tasks.push(new TUITask(taskDefinitions[i], `${i + 1}`))
    }

    // TODO: This isn't very efficient - improve it
    // Initial evaluation of enabled/skipped
    const updateFlags = async (task: TUITask) => {
      if (typeof task.task !== 'function') {
        for (const childTask of task.task) {
          await updateFlags(childTask)
        }

        const allDisabled = task.task.every(
          (childTask) => childTask.state === 'disabled'
        )
        if (allDisabled) {
          task.state = 'disabled'
        }

        const allSkipped = task.task.every(
          (childTask) => childTask.state === 'skipped'
        )
        if (allSkipped) {
          task.state = 'skipped'
        }

        return
      }

      const enabled =
        typeof task.enable === 'function'
          ? await task.enable(task)
          : task.enable
      if (!enabled) {
        task.state = 'disabled'
      }

      const skipped =
        typeof task.skip === 'function' ? await task.skip(task) : task.skip
      if (skipped) {
        task.state = 'skipped'
      }
    }
    for (const task of tasks) {
      await updateFlags(task)
    }

    // Start rendering the tasks
    process.stdout.write(ENTER_ALT_SCREEN)
    TUITask.renderingTimerId = setInterval(() => {
      TUITask.drawTasks(tasks)
    }, 80)

    // Run the tasks
    for (const task of tasks) {
      await task.run()
      if (task.state === 'errored') {
        break
      }
    }

    // Stop rendering the tasks
    clearInterval(TUITask.renderingTimerId)
    TUITask.renderingTimerId = undefined

    // Draw the final state of the task list to the standard screen
    process.stdout.write(EXIT_ALT_SCREEN)
    TUITask.drawTasks(tasks, { preserveScreen: true })
    process.stdout.write('\n')
  }

  private static drawTasks(
    tasks: TUITask[],
    options?: { preserveScreen?: boolean }
  ) {
    const content = tasks.map((task) => task.renderToString()).join('\n')
    process.stdout.write(ansiEscapes.cursorHide)
    if (options?.preserveScreen !== true) {
      process.stdout.write(ansiEscapes.clearScreen)
    }
    process.stdout.write(content.trimEnd())
    process.stdout.write(ansiEscapes.cursorShow)
  }
}
