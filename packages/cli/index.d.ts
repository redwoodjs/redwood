declare namespace NodeJS {
  interface Global {
    __dirname: string
  }
}

declare module 'pascalcase' {
  function pascalcase(input: string): string
  export default pascalcase
}
