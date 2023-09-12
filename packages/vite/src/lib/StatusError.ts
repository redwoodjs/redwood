export class StatusError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
  }
}
