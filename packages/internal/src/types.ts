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

export interface NodeTargetPaths {
  base: string
  db: string
  dbSchema: string
  src: string
  functions: string
  graphql: string
  lib: string
  services: string
  config: string
}

export interface BrowserTargetPaths {
  base: string
  src: string
  routes: string
  pages: string
  components: string
  layouts: string
  config: string
  webpack: string
}

export type Paths = {
  base: string
  web: BrowserTargetPaths
  api: NodeTargetPaths
}
export type PagesDependency = {
  const: string
  path: string
  importStatement: string
}
