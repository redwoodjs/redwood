import { trace, SpanStatusCode } from '@opentelemetry/api'

export function recordTelemetryAttribute(key: string, value: any) {
  trace.getActiveSpan()?.setAttribute(key, value)
}

export function recordTelemetryError(error: Error) {
  trace.getActiveSpan()?.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.toString().split('\n')[0],
  })
  trace.getActiveSpan()?.recordException(error)
}
