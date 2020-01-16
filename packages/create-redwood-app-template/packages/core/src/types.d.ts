export type Config = {
  web: {
    port: number
    apiProxyPath: string
  }
  api: {
    port: number
  }
}

export type Paths = {
  base: string
  web: {
    routes: string
    pages: string
    components: string
  }
  api: {
    functions: string
    graphql: string
  }
}

export type PagesDependencies = [
  {
    const: string
    path: string
    importStatement: string
  }?
]
