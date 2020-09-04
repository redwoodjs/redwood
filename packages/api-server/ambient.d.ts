declare module '@babel/register' {
  export default function (options: any): void
}

declare module 'youch' {
  export default class {
    constructor(error: Error)
    toJSON(): Record<string, unknown>
  }
}

declare module 'youch-terminal' {
  export default function (json: Record<string, unknown>): string
}
