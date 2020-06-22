declare namespace NodeJS {
  interface Global {
    __dirname: string
  }
}

// TODO: Remove the following declarations when these files get types.
declare module 'src/lib/test'

declare module 'pascalcase' {
  function pascalcase(input: string): string
  export default pascalcase
}

declare module 'listr-verbose-renderer'
