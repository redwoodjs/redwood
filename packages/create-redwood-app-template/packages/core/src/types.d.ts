export type Config = {
  baseDir: string
  web: {
    port: number
    apiProxyPath: string
    paths: {
      routes: string
      pages: string
      components: string
    }
  }
  api: {
    port: number
    paths: {
      functions: string
      graphql: string
    }
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
