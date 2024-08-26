import { chalk, ProcessOutput } from 'zx'

import { FRAMEWORK_PATH } from './lib.mjs'

export enum Stage {
  NONE = 0,
  BUILD_PACK = 1,
  MOVE = 2,
  RESOLUTIONS = 3,
  YARN = 4,
  DONE = 5,
}

export class OutputManager {
  timeout?: NodeJS.Timeout
  error?: unknown
  stage: Stage
  triggeredAt: Date
  triggeredBy: string
  index: number
  timings: Map<Stage, string>
  running: boolean
  disabled: boolean
  previousLines: string[]
  blinker: string

  constructor({ disabled }: { disabled: boolean }) {
    this.stage = Stage.NONE
    this.triggeredAt = new Date()
    this.triggeredBy = 'Unknown'
    this.index = 0
    this.timings = new Map<Stage, string>()
    this.running = false
    this.previousLines = []
    this.blinker = '-'

    this.disabled = disabled
  }

  start({ triggeredBy }: { triggeredBy: string }) {
    this.triggeredBy = triggeredBy
    if (this.disabled) {
      return
    }

    this.running = true
    process.stdout.write('\n')
    this.timeout = setInterval(() => {
      this.render()
      this.index++
      if (this.index % 10 === 0) {
        this.blinker = this.blinker === '=' ? '-' : '='
      }
    }, 50)

    process.on('SIGINT', () => {
      this.stop()
    })
  }

  stop(error?: unknown) {
    if (!this.running) {
      return
    }

    this.error = error

    clearInterval(this.timeout)
    this.running = false
    this.render()
  }

  switchStage(stage: Stage) {
    if (this.stage === Stage.NONE) {
      performance.mark('start:' + stage)
    } else {
      performance.mark('stop:' + this.stage)
      performance.mark('start:' + stage)

      performance.measure(
        this.stage + ':' + stage,
        'start:' + this.stage,
        'stop:' + this.stage,
      )
      const measure = performance.getEntriesByName(this.stage + ':' + stage)[0]
      this.timings.set(
        this.stage,
        Math.round(measure.duration).toLocaleString(),
      )
    }

    this.stage = stage
  }

  private generateLines() {
    const lines = [
      chalk.cyan('[TarSync]'),
      chalk.dim(FRAMEWORK_PATH),
      chalk.dim(
        `${this.triggeredAt.toLocaleTimeString()}: ${this.triggeredBy}`,
      ),
      '',
    ]

    if (this.error) {
      lines.push(chalk.red('Error:'))
      lines.push(chalk.red('--- start ---'))
      if (this.error instanceof ProcessOutput) {
        lines.push(this.error.valueOf())
      } else {
        lines.push(this.error.toString())
      }
      lines.push(chalk.red('--- end ---'))
      return lines
    }

    lines.push(
      this.getPrefix(Stage.BUILD_PACK) +
        ' Building and packaging' +
        this.getSuffix(Stage.BUILD_PACK),
    )
    lines.push(
      this.getPrefix(Stage.MOVE) +
        ' Moving tarballs' +
        this.getSuffix(Stage.MOVE),
    )
    lines.push(
      this.getPrefix(Stage.RESOLUTIONS) +
        ' Updating resolutions' +
        this.getSuffix(Stage.RESOLUTIONS),
    )
    lines.push(
      this.getPrefix(Stage.YARN) +
        ' Running yarn install' +
        this.getSuffix(Stage.YARN),
    )

    if (this.stage === Stage.DONE) {
      const totalTime = Date.now() - this.triggeredAt.getTime()
      lines.push(
        chalk.green('Done!') + chalk.dim(` (${totalTime.toLocaleString()}ms)`),
      )
      lines.push('')
    }

    lines.push('')

    return lines
  }

  private getPrefix(stage: Stage) {
    const color = this.error ? chalk.red : chalk.yellow
    let prefix = '[ ]'
    if (this.stage === stage) {
      prefix = color(`[${this.blinker}]`)
    } else if (this.stage < stage) {
      prefix = '[ ]'
    } else if (this.stage > stage) {
      prefix = chalk.green('[x]')
    }
    return prefix
  }

  private getSuffix(stage: Stage) {
    if (this.timings.has(stage)) {
      return chalk.dim(` (${this.timings.get(stage)}ms)`)
    }
    return ''
  }

  render() {
    // Reset cursor to the beginning of the current line
    process.stdout.write('\x1b[0G')
    // Clear the current line
    process.stdout.write('\x1b[2K')

    // Clear previous lines
    for (let i = 0; i < this.previousLines.length - 1; i++) {
      // Move the cursor up one line
      process.stdout.write('\x1b[A')
      // Clear the entire line
      process.stdout.write('\x1b[2K')
    }

    const newLines = this.generateLines()
    this.previousLines = newLines
    process.stdout.write(newLines.join('\n'))
  }
}
