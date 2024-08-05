// Defines the basic shape of a logger that RedwoodJob will invoke to print
// debug messages. RedwoodJob will fallback to use `console` if no
// logger is passed in to RedwoodJob or any adapter. Luckily both Redwood's
// Logger and the standard console logger conform to this shape.
export interface BasicLogger {
  debug: (message?: any, ...optionalParams: any[]) => void
  info: (message?: any, ...optionalParams: any[]) => void
  warn: (message?: any, ...optionalParams: any[]) => void
  error: (message?: any, ...optionalParams: any[]) => void
}
