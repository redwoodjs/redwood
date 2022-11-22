export class Logger {
  enabled = false
  constructor(debug: boolean) {
    this.enabled = debug
  }

  error(err: any) {
    this.enabled && console.error(err)
  }

  log(msg: any, rest?: any) {
    this.enabled && console.log(msg, ...rest)
  }
}
