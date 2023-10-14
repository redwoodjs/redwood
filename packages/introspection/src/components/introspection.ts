import path from 'node:path'

export type RedwoodIntrospectionError = {
  component: {
    type: string
    filepath: string
    name: string
  }
  message: string
  error?: Error
}

export type RedwoodIntrospectionWarning = Omit<
  RedwoodIntrospectionError,
  'error'
>

export abstract class RedwoodIntrospectionComponent {
  abstract readonly type: string
  readonly filepath: string
  readonly name: string

  constructor(filepath: string, name?: string) {
    this.filepath = filepath
    this.name = name ?? path.parse(filepath).name
  }

  abstract getErrors():
    | RedwoodIntrospectionError[]
    | Promise<RedwoodIntrospectionError[]>
  abstract getWarnings():
    | RedwoodIntrospectionWarning[]
    | Promise<RedwoodIntrospectionWarning[]>
}
