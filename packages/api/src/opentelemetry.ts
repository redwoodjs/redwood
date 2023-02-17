import * as opentelemetry from '@opentelemetry/api'

export function instrumentService<TArgs extends any[], TReturn>(
  targetFunctionName: string,
  targetFunction: (...parameters: TArgs) => TReturn
): (...parameters: TArgs) => Promise<TReturn> {
  return async (...parameters: TArgs) => {
    const tracer = opentelemetry.trace.getTracer('redwoodjs')
    const result = tracer.startActiveSpan(
      `redwoodjs:service:${targetFunctionName}`,
      async (span) => {
        try {
          const result = await targetFunction(...parameters)
          span.end()
          return result
        } catch (error) {
          span.recordException(error as Error)
          span.end()
          throw error
        }
      }
    )
    return result
  }
}
