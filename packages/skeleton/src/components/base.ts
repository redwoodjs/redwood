import path from 'path'

export interface RedwoodDiagnostics {
  warnings: string[]
  errors: string[]
  getStatistics(): string
  printStatistics(): void
  printWarnings(): void
  printErrors(): void
}

export abstract class RedwoodSkeleton implements RedwoodDiagnostics {
  warnings: string[] = []
  errors: string[] = []

  public readonly name: string

  constructor(public readonly filepath: string) {
    this.name = path.parse(this.filepath).name
  }

  abstract getStatistics(): string
  printStatistics(): void {
    console.log(this.getStatistics())
  }

  printWarnings(): void {
    console.log(this.warnings)
  }

  printErrors(): void {
    console.log(this.errors)
  }
}
