declare module '@babel/register' {
  export default function (options: any): void
}

declare module 'youch' {
  export default class {
    constructor(error: Error)
    toJSON(): object
  }
}

declare module 'youch-terminal' {
  export default function (json: object): string
}
