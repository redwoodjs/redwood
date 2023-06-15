import chalk from 'chalk'
// TODO: Add this to the dependencies
import execa from 'execa'

import { ReactiveTUIContent } from './index'

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

const TASK_TITLE_SPINNER_CHARATERS = [
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

  readonly isChildTask
  readonly isParentTask

  // lifecycle functions
  skip: ((task: TUITask) => Promise<boolean>) | boolean
  enable: ((task: TUITask) => Promise<boolean>) | boolean

  task: ((task: TUITask) => Promise<void>) | TUITaskDefinition[]
  onError: (task: TUITask, error: Error) => Promise<void>

  // context
  context: TUITaskContext = {}

  // state
  state: 'pending' | 'running' | 'completed' | 'skipped' | 'errored' = 'pending'

  // title
  private titleSpinnerIndex = 0

  // body content
  private element: ReactiveTUIContent

  constructor(
    definition: TUITaskDefinition,
    index: string,
    isChildTask = false
  ) {
    this.index = index

    this.title = definition.title
    this.task = definition.task
    this.enable = definition.enable ?? true
    this.skip = definition.skip ?? false
    this.onError = definition.onError ?? (async () => {})

    this.element = new ReactiveTUIContent({})

    this.isChildTask = isChildTask
    this.isParentTask = Array.isArray(this.task)
  }

  // rendering

  renderTitleToString() {
    // show '1' for the parent and '1.x' for the children
    const formattedIndex = this.isChildTask
      ? this.index
      : this.index.split('.')[0]

    let formattedTitle = `${formattedIndex}: ${this.title}`

    if (this.state === 'running') {
      formattedTitle = `${
        TASK_TITLE_SPINNER_CHARATERS[this.titleSpinnerIndex]
      } ${formattedTitle} `
      this.titleSpinnerIndex =
        (this.titleSpinnerIndex + 1) % TASK_TITLE_SPINNER_CHARATERS.length
    } else if (this.state === 'completed') {
      formattedTitle = `${chalk.green('✓')} ${formattedTitle}`
    } else if (this.state === 'skipped') {
      formattedTitle = `${chalk.yellow('-')} ${formattedTitle}`
    } else if (this.state === 'errored') {
      formattedTitle = `${chalk.red('✗')} ${formattedTitle}`
    } else if (this.state === 'pending') {
      formattedTitle = `${chalk.gray('⠿')} ${formattedTitle}`
    }

    if (this.isChildTask) {
      formattedTitle = `  ${formattedTitle}`
    }
    return formattedTitle
  }

  renderBodyToString() {
    // TODO: Consider this further
    return this.element.renderToString()
  }

  // lifecycle

  async run() {
    // TODO: Implement this
  }

  // helpers

  async runExeca(
    cmd: string,
    args: string[],
    execaOptions: any,
    _displayOptions = {}
  ) {
    const subprocess = execa(cmd, args, {
      ...execaOptions,
      stdio: ['inherit', 'pipe', 'pipe'],
    })
    await subprocess
    // Update display when complete.
  }
}
