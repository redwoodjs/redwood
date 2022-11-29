export class Logger {
  enabled = false
  constructor(debug: boolean) {
    this.enabled = debug
  }

  error(err: any) {
    this.enabled && console.error(err)
  }

  log(msg: any) {
    this.enabled && console.log(msg)
  }

  errorUnless(err: any) {
    !this.enabled && console.error(err)
  }

  logUnless(msg: any) {
    !this.enabled && console.log(msg)
  }
}
