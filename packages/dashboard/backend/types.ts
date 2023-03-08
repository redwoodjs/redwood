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

export interface DashboardConfig {
  authProvider: string
}
