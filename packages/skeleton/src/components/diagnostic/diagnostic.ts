export interface RedwoodDiagnostics {
  warnings: string[]
  errors: string[]
  hasErrors(): boolean
  hasWarnings(): boolean
  printWarnings(): void
  printErrors(): void
}
