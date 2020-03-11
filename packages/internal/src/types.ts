export type Config = {
  web: {
    host: string
    port: number
    apiProxyPath: string
  }
  api: {
    host: string
    port: number
  }
  browser: {
    open: boolean | string
  }
}

export type Paths = {
  base: string
  web: {
    routes: string
    pages: string
    components: string
    layouts: string
    src: string
  }
  api: {
    db: string
    dbSchema: string
    functions: string
    graphql: string
    services: string
    src: string
  }
}
export type PagesDependency = {
  const: string
  path: string
  importStatement: string
}
