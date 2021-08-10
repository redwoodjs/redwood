declare module 'kill-port' {
  export default function (port: number, method: 'tcp' | 'udp'): Promise<void>
}

declare module '@babel/register' {
  import type { TransformOptions } from '@babel/core'
  // See https://babeljs.io/docs/en/babel-register
  interface RequireHookArg extends TransformOptions {
    extensions?: string[]
    cache?: boolean
  }
  export default function (transformOptions: RequireHookArg): void
}
