import path from 'path'

import chalk from 'chalk'

import { RedwoodDiagnostics, RedwoodError, RedwoodWarning } from './diagnostic'

export abstract class RedwoodSkeleton implements RedwoodDiagnostics {
  warnings: RedwoodWarning[] = []
  errors: RedwoodError[] = []

  readonly name: string

  constructor(readonly filepath: string, name?: string) {
    this.name = name ?? path.parse(this.filepath).name // default to the file name if not given a specific name
  }

  hasWarnings() {
    return this.warnings.length > 0
  }

  printWarnings() {
    if (!this.hasWarnings()) {
      return
    }

    const titleLine = `${chalk.bgYellow('[Warn]')}\t${this.name} ${chalk.dim(
      this.filepath
    )}`

    const warningLines = this.warnings.map((warning) => {
      return ` (W${warning.code}) ${warning.message}\n`
    })

    console.log(titleLine.concat('\n', ...warningLines).trimEnd())
  }

  hasErrors() {
    return this.errors.length > 0
  }

  printErrors() {
    if (!this.hasErrors()) {
      return
    }

    const titleLine = `${chalk.bgRed('[Error]')}\t${this.name} ${chalk.dim(
      this.filepath
    )}`

    const errorLines = this.errors.map((error) => {
      return ` (E${error.code}) ${error.message}\n`
    })

    console.log(titleLine.concat('\n', ...errorLines).trimEnd())
  }

  executeAdditionalChecks(): void {
    // Default implemention should do nothing, subclasses can override if needed
  }
}
