import path from 'path'

import chalk from 'chalk'

export interface RedwoodDiagnostics {
  warnings: string[]
  errors: string[]
  getInformation(): string
  printInformation(): void
  printWarnings(): void
  printErrors(): void
}

export abstract class RedwoodSkeleton implements RedwoodDiagnostics {
  warnings: string[] = []
  errors: string[] = []

  public readonly name: string

  constructor(public readonly filepath: string, name?: string) {
    this.name = name ?? path.parse(this.filepath).name
  }

  abstract getInformation(): string
  printInformation(): void {
    const info = this.getInformation()
    if (info) {
      const titleLine = chalk
        .bgCyan('[Info]')
        .concat(' ', this.name, ' ', `${this.filepath}`)
      console.log(titleLine.concat('\n', info).trimEnd())
    }
  }

  printWarnings(): void {
    if (this.warnings.length > 0) {
      const titleLine = chalk
        .bgYellow('[Warning]')
        .concat(' ', this.name, ' ', `${this.filepath}`)
      const warningLines = this.warnings.map((warning, index) => {
        return `  (${index + 1}) ${warning}\n`
      })
      console.log(titleLine.concat('\n', ...warningLines).trimEnd())
    }
  }

  printErrors(): void {
    if (this.errors.length > 0) {
      const titleLine = chalk
        .bgRed('[Error]')
        .concat(' ', this.name, ' ', `${this.filepath}`)
      const errorLines = this.errors.map((error, index) => {
        return `  (${index + 1}) ${error}\n`
      })
      console.log(titleLine.concat('\n', ...errorLines).trimEnd())
    }
  }
}
