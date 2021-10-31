export class RedwoodError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RedwoodError'
  }
}
