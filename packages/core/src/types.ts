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
    layouts: string
    src: string
  }
  api: {
    db: string
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
