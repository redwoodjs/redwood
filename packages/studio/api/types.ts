export interface ResourceSpan {
  scopeSpans: ScopeSpan[]
  resource: {
    attributes: RawAttribute[]
  }
}

export interface ScopeSpan {
  scope: {
    name: string
  }
  spans: RawSpan[]
}

export interface RawSpan {
  traceId: string
  spanId: string
  parentSpanId: string
  name: string
  kind: number
  startTimeUnixNano: string
  endTimeUnixNano: string
  attributes?: RawAttribute[]
  events?: RawEvent[]
  status?: {
    code?: number
    message?: string
  }
}

export interface RawAttribute {
  key: string
  value: {
    stringValue?: string
    intValue?: string
    boolValue?: boolean
    value?: any
  }
}

export interface RawEvent {
  timeUnixNano: string
  name: string
  attributes: RawAttribute[]
}

export interface RestructuredAttributes {
  [key: string]: string | number | boolean | null
}

export interface RestructuredEvent {
  name: string
  time: string
  attributes: RestructuredAttributes
}

export interface RestructuredSpan {
  trace: string
  id: string
  parent: string
  name: string
  kind: number
  statusCode?: number
  statusMessage?: string
  startNano: string
  endNano: string
  durationNano: string
  events?: RestructuredEvent[]
  attributes?: RestructuredAttributes
  resourceAttributes?: RestructuredAttributes
}

export interface ApiConfig {
  title: string
  name?: string
  host: string
  port: number
  path: string
  // target: TargetEnum.NODE
  schemaPath: string
  serverConfig: string
  debugPort?: number
}

export interface WebConfig {
  title: string
  name?: string
  host: string
  port: number
  path: string
  // target: TargetEnum.BROWSER
  // bundler: BundlerEnum
  includeEnvironmentVariables: string[]
  /**
   * Specify the URL to your api-server.
   * This can be an absolute path proxied on the current domain (`/.netlify/functions`),
   * or a fully qualified URL (`https://api.example.org:8911/functions`).
   *
   * Note: This should not include the path to the GraphQL Server.
   **/
  apiUrl: string
  /**
   * Optional: FQDN or absolute path to the GraphQL serverless function, without the trailing slash.
   * This will override the apiUrl configuration just for the graphql function
   * Example: `./redwood/functions/graphql` or `https://api.redwoodjs.com/graphql`
   */
  apiGraphQLUrl?: string

  fastRefresh: boolean
  a11y: boolean
  sourceMap: boolean
  graphqlEndpoint?: string
}

export interface GraphiQLStudioConfig {
  endpoint?: string
  authImpersonation?: AuthImpersonationConfig
}

export interface AuthImpersonationConfig {
  authProvider?: string
  jwtSecret?: string
  userId?: string
  email?: string
  roles?: string[]
}

export interface StudioConfig {
  inMemory: boolean
  graphiql?: GraphiQLStudioConfig
}

export type SpanType =
  | 'http'
  | 'sql'
  | 'graphql'
  | 'prisma'
  | 'redwood-service'
  | null
