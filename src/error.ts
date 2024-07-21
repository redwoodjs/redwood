export class ExitCodeError extends Error {
  exitCode: number

  constructor(exitCode: number, message: string) {
    super(message)
    this.exitCode = exitCode
  }
}
